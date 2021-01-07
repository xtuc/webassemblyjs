// @flow

import { CompileError } from "@webassemblyjs/helper-api-error";
import * as ieee754 from "@webassemblyjs/ieee754";
import * as utf8 from "@webassemblyjs/utf8";
import * as t from "@webassemblyjs/ast";
import { define } from "mamacro";

declare function WITH_LOC<T>(n: T, startLoc: Position): T;

define(WITH_LOC, (node, startLoc) => `
    (function() {
      const endLoc = getPosition();

       return t.withLoc(
        ${node},
        endLoc,
        ${startLoc}
      );
    })()
  `);

import {
  decodeInt32,
  decodeUInt32,
  MAX_NUMBER_OF_BYTE_U32,
  decodeInt64,
  decodeUInt64,
  MAX_NUMBER_OF_BYTE_U64
} from "@webassemblyjs/leb128";

import constants from "@webassemblyjs/helper-wasm-bytecode";

function toHex(n: number): string {
  return "0x" + Number(n).toString(16);
}

function byteArrayEq(l: Array<Byte>, r: Array<Byte>): boolean {
  if (l.length !== r.length) {
    return false;
  }

  for (let i = 0; i < l.length; i++) {
    if (l[i] !== r[i]) {
      return false;
    }
  }

  return true;
}

export function decode(ab: ArrayBuffer, opts: DecoderOpts): Program {
  const buf = new Uint8Array(ab);

  const getUniqueName = t.getUniqueNameGenerator();

  let offset = 0;

  function getPosition(): Position {
    return { line: -1, column: offset };
  }

  function dump(b: Array<Byte>, msg: any) {
    if (opts.dump === false) return;

    const pad = "\t\t\t\t\t\t\t\t\t\t";
    let str = "";

    if (b.length < 5) {
      str = b.map(toHex).join(" ");
    } else {
      str = "...";
    }

    console.log(toHex(offset) + ":\t", str, pad, ";", msg);
  }

  function dumpSep(msg: string) {
    if (opts.dump === false) return;

    console.log(";", msg);
  }

  /**
   * TODO(sven): we can atually use a same structure
   * we are adding incrementally new features
   */
  const state: State = {
    elementsInFuncSection: [],
    elementsInExportSection: [],
    elementsInCodeSection: [],

    /**
     * Decode memory from:
     * - Memory section
     */
    memoriesInModule: [],

    /**
     * Decoded types from:
     * - Type section
     */
    typesInModule: [],

    /**
     * Decoded functions from:
     * - Function section
     * - Import section
     */
    functionsInModule: [],

    /**
     * Decoded tables from:
     * - Table section
     */
    tablesInModule: [],

    /**
     * Decoded globals from:
     * - Global section
     */
    globalsInModule: []
  };

  function isEOF(): boolean {
    return offset >= buf.length;
  }

  function eatBytes(n: number) {
    offset = offset + n;
  }

  function readBytesAtOffset(
    _offset: number,
    numberOfBytes: number
  ): Array<Byte> {
    const arr = [];

    for (let i = 0; i < numberOfBytes; i++) {
      arr.push(buf[_offset + i]);
    }

    return arr;
  }

  function readBytes(numberOfBytes: number): Array<Byte> {
    return readBytesAtOffset(offset, numberOfBytes);
  }

  function readF64(): DecodedF64 {
    const bytes = readBytes(ieee754.NUMBER_OF_BYTE_F64);
    const value = ieee754.decodeF64(bytes);

    if (Math.sign(value) * value === Infinity) {
      return {
        value: Math.sign(value),
        inf: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F64
      };
    }

    if (isNaN(value)) {
      const sign = bytes[bytes.length - 1] >> 7 ? -1 : 1;
      let mantissa = 0;
      for (let i = 0; i < bytes.length - 2; ++i) {
        mantissa += bytes[i] * 256 ** i;
      }
      mantissa += (bytes[bytes.length - 2] % 16) * 256 ** (bytes.length - 2);

      return {
        value: sign * mantissa,
        nan: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F64
      };
    }

    return {
      value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F64
    };
  }

  function readF32(): DecodedF32 {
    const bytes = readBytes(ieee754.NUMBER_OF_BYTE_F32);
    const value = ieee754.decodeF32(bytes);

    if (Math.sign(value) * value === Infinity) {
      return {
        value: Math.sign(value),
        inf: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F32
      };
    }

    if (isNaN(value)) {
      const sign = bytes[bytes.length - 1] >> 7 ? -1 : 1;
      let mantissa = 0;
      for (let i = 0; i < bytes.length - 2; ++i) {
        mantissa += bytes[i] * 256 ** i;
      }
      mantissa += (bytes[bytes.length - 2] % 128) * 256 ** (bytes.length - 2);

      return {
        value: sign * mantissa,
        nan: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F32
      };
    }

    return {
      value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F32
    };
  }

  function readUTF8String(): DecodedUTF8String {
    const lenu32 = readU32();

    // Don't eat any bytes. Instead, peek ahead of the current offset using
    // readBytesAtOffset below. This keeps readUTF8String neutral with respect
    // to the current offset, just like the other readX functions.

    const strlen = lenu32.value;

    dump([strlen], "string length");

    const bytes = readBytesAtOffset(offset + lenu32.nextIndex, strlen);

    const value = utf8.decode(bytes);

    return {
      value,
      nextIndex: strlen + lenu32.nextIndex
    };
  }

  /**
   * Decode an unsigned 32bits integer
   *
   * The length will be handled by the leb librairy, we pass the max number of
   * byte.
   */
  function readU32(): Decoded32 {
    const bytes = readBytes(MAX_NUMBER_OF_BYTE_U32);
    const buffer = Buffer.from(bytes);

    return decodeUInt32(buffer);
  }

  function readVaruint32(): Decoded32 {
    // where 32 bits = max 4 bytes

    const bytes = readBytes(4);
    const buffer = Buffer.from(bytes);

    return decodeUInt32(buffer);
  }

  function readVaruint7(): Decoded32 {
    // where 7 bits = max 1 bytes

    const bytes = readBytes(1);
    const buffer = Buffer.from(bytes);

    return decodeUInt32(buffer);
  }

  /**
   * Decode a signed 32bits interger
   */
  function read32(): Decoded32 {
    const bytes = readBytes(MAX_NUMBER_OF_BYTE_U32);
    const buffer = Buffer.from(bytes);

    return decodeInt32(buffer);
  }

  /**
   * Decode a signed 64bits integer
   */
  function read64(): Decoded64 {
    const bytes = readBytes(MAX_NUMBER_OF_BYTE_U64);
    const buffer = Buffer.from(bytes);

    return decodeInt64(buffer);
  }

  function readU64(): Decoded64 {
    const bytes = readBytes(MAX_NUMBER_OF_BYTE_U64);
    const buffer = Buffer.from(bytes);

    return decodeUInt64(buffer);
  }

  function readByte(): Byte {
    return readBytes(1)[0];
  }

  function parseModuleHeader() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    const header = readBytes(4);

    if (byteArrayEq(constants.magicModuleHeader, header) === false) {
      throw new CompileError("magic header not detected");
    }

    dump(header, "wasm magic header");

    eatBytes(4);
  }

  function parseVersion() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    const version = readBytes(4);

    if (byteArrayEq(constants.moduleVersion, version) === false) {
      throw new CompileError("unknown binary version");
    }

    dump(version, "wasm version");

    eatBytes(4);
  }

  function parseVec<T>(cast: Byte => T): Array<T> {
    const u32 = readU32();
    const length = u32.value;
    eatBytes(u32.nextIndex);

    dump([length], "number");

    if (length === 0) {
      return [];
    }

    const elements = [];

    for (let i = 0; i < length; i++) {
      const byte = readByte();
      eatBytes(1);

      const value = cast(byte);

      dump([byte], value);

      if (typeof value === "undefined") {
        throw new CompileError(
          "Internal failure: parseVec could not cast the value"
        );
      }

      elements.push(value);
    }

    return elements;
  }

  // Type section
  // https://webassembly.github.io/spec/binary/modules.html#binary-typesec
  function parseTypeSection(numberOfTypes: number) {
    const typeInstructionNodes = [];

    dump([numberOfTypes], "num types");

    for (let i = 0; i < numberOfTypes; i++) {
      const startLoc = getPosition();

      dumpSep("type " + i);

      const type = readByte();
      eatBytes(1);

      if (type == constants.types.func) {
        dump([type], "func");

        const paramValtypes: Array<Valtype> = parseVec(
          b => constants.valtypes[b]
        );
        const params = paramValtypes.map(v => t.funcParam(/*valtype*/ v));

        const result: Array<Valtype> = parseVec(b => constants.valtypes[b]);

        typeInstructionNodes.push(
          WITH_LOC(
            t.typeInstruction(undefined, t.signature(params, result)),
            startLoc
          )
        );

        state.typesInModule.push({
          params,
          result
        });
      } else {
        throw new Error("Unsupported type: " + toHex(type));
      }
    }

    return typeInstructionNodes;
  }

  // Import section
  // https://webassembly.github.io/spec/binary/modules.html#binary-importsec
  function parseImportSection(numberOfImports: number) {
    const imports = [];

    for (let i = 0; i < numberOfImports; i++) {
      dumpSep("import header " + i);

      const startLoc = getPosition();

      /**
       * Module name
       */
      const moduleName = readUTF8String();
      eatBytes(moduleName.nextIndex);

      dump([], `module name (${moduleName.value})`);

      /**
       * Name
       */
      const name = readUTF8String();
      eatBytes(name.nextIndex);

      dump([], `name (${name.value})`);

      /**
       * Import descr
       */
      const descrTypeByte = readByte();
      eatBytes(1);

      const descrType = constants.importTypes[descrTypeByte];

      dump([descrTypeByte], "import kind");

      if (typeof descrType === "undefined") {
        throw new CompileError(
          "Unknown import description type: " + toHex(descrTypeByte)
        );
      }

      let importDescr;

      if (descrType === "func") {
        const indexU32 = readU32();
        const typeindex = indexU32.value;
        eatBytes(indexU32.nextIndex);

        dump([typeindex], "type index");

        const signature = state.typesInModule[typeindex];

        if (typeof signature === "undefined") {
          throw new CompileError(`function signature not found (${typeindex})`);
        }

        const id = getUniqueName("func");

        importDescr = t.funcImportDescr(
          id,
          t.signature(signature.params, signature.result)
        );

        state.functionsInModule.push({
          id: t.identifier(name.value),
          signature,
          isExternal: true
        });
      } else if (descrType === "global") {
        importDescr = parseGlobalType();

        const globalNode = t.global(importDescr, []);

        state.globalsInModule.push(globalNode);
      } else if (descrType === "table") {
        importDescr = parseTableType(i);
      } else if (descrType === "mem") {
        const memoryNode = parseMemoryType(0);

        state.memoriesInModule.push(memoryNode);

        importDescr = memoryNode;
      } else {
        throw new CompileError("Unsupported import of type: " + descrType);
      }

      imports.push(
        WITH_LOC(
          t.moduleImport(moduleName.value, name.value, importDescr),
          startLoc
        )
      );
    }

    return imports;
  }

  // Function section
  // https://webassembly.github.io/spec/binary/modules.html#function-section
  function parseFuncSection(numberOfFunctions: number) {
    dump([numberOfFunctions], "num funcs");

    for (let i = 0; i < numberOfFunctions; i++) {
      const indexU32 = readU32();
      const typeindex = indexU32.value;
      eatBytes(indexU32.nextIndex);

      dump([typeindex], "type index");

      const signature = state.typesInModule[typeindex];

      if (typeof signature === "undefined") {
        throw new CompileError(`function signature not found (${typeindex})`);
      }

      // preserve anonymous, a name might be resolved later
      const id = t.withRaw(t.identifier(getUniqueName("func")), "");

      state.functionsInModule.push({
        id,
        signature,
        isExternal: false
      });
    }
  }

  // Export section
  // https://webassembly.github.io/spec/binary/modules.html#export-section
  function parseExportSection(numberOfExport: number) {
    dump([numberOfExport], "num exports");

    // Parse vector of exports
    for (let i = 0; i < numberOfExport; i++) {
      const startLoc = getPosition();

      /**
       * Name
       */
      const name = readUTF8String();
      eatBytes(name.nextIndex);

      dump([], `export name (${name.value})`);

      /**
       * exportdescr
       */

      const typeIndex = readByte();
      eatBytes(1);

      dump([typeIndex], "export kind");

      const indexu32 = readU32();
      const index = indexu32.value;
      eatBytes(indexu32.nextIndex);

      dump([index], "export index");

      let id: Identifier, signature;

      if (constants.exportTypes[typeIndex] === "Func") {
        const func = state.functionsInModule[index];

        if (typeof func === "undefined") {
          throw new CompileError(`unknown function (${index})`);
        }

        id = t.numberLiteralFromRaw(index, String(index));

        signature = func.signature;
      } else if (constants.exportTypes[typeIndex] === "Table") {
        const table = state.tablesInModule[index];

        if (typeof table === "undefined") {
          throw new CompileError(`unknown table ${index}`);
        }

        id = t.numberLiteralFromRaw(index, String(index));

        signature = null;
      } else if (constants.exportTypes[typeIndex] === "Mem") {
        const memNode = state.memoriesInModule[index];

        if (typeof memNode === "undefined") {
          throw new CompileError(`unknown memory ${index}`);
        }

        id = t.numberLiteralFromRaw(index, String(index));

        signature = null;
      } else if (constants.exportTypes[typeIndex] === "Global") {
        const global = state.globalsInModule[index];

        if (typeof global === "undefined") {
          throw new CompileError(`unknown global ${index}`);
        }

        id = t.numberLiteralFromRaw(index, String(index));

        signature = null;
      } else {
        console.warn("Unsupported export type: " + toHex(typeIndex));
        return;
      }

      const endLoc = getPosition();

      state.elementsInExportSection.push({
        name: name.value,
        type: constants.exportTypes[typeIndex],
        signature,
        id,
        index,
        endLoc,
        startLoc
      });
    }
  }

  // Code section
  // https://webassembly.github.io/spec/binary/modules.html#code-section
  function parseCodeSection(numberOfFuncs: number) {
    dump([numberOfFuncs], "number functions");

    // Parse vector of function
    for (let i = 0; i < numberOfFuncs; i++) {
      const startLoc = getPosition();

      dumpSep("function body " + i);

      // the u32 size of the function code in bytes
      // Ignore it for now
      const bodySizeU32 = readU32();
      eatBytes(bodySizeU32.nextIndex);

      dump([bodySizeU32.value], "function body size");

      const code: Array<Instruction> = [];

      /**
       * Parse locals
       */
      const funcLocalNumU32 = readU32();
      const funcLocalNum = funcLocalNumU32.value;
      eatBytes(funcLocalNumU32.nextIndex);

      dump([funcLocalNum], "num locals");

      const locals = [];

      for (let i = 0; i < funcLocalNum; i++) {
        const startLoc = getPosition();

        const localCountU32 = readU32();
        const localCount = localCountU32.value;
        eatBytes(localCountU32.nextIndex);

        dump([localCount], "num local");

        const valtypeByte = readByte();
        eatBytes(1);

        const type = constants.valtypes[valtypeByte];
        const args = [];

        for (let i = 0; i < localCount; i++) {
          args.push(t.valtypeLiteral(type));
        }

        const localNode = WITH_LOC(t.instruction("local", args), startLoc);

        locals.push(localNode);

        dump([valtypeByte], type);

        if (typeof type === "undefined") {
          throw new CompileError("Unexpected valtype: " + toHex(valtypeByte));
        }
      }

      code.push(...locals);

      // Decode instructions until the end
      parseInstructionBlock(code);

      const endLoc = getPosition();

      state.elementsInCodeSection.push({
        code,
        locals,

        endLoc,
        startLoc,
        bodySize: bodySizeU32.value
      });
    }
  }

  function parseInstructionBlock(code: Array<Instruction>) {
    while (true) {
      const startLoc = getPosition();

      let instructionAlreadyCreated = false;

      let instructionByte = readByte();
      eatBytes(1);

      if (instructionByte === 0xfe) {
        instructionByte = 0xfe00 + readByte();
        eatBytes(1);
      }

      const instruction = constants.symbolsByByte[instructionByte];

      if (typeof instruction === "undefined") {
        throw new CompileError(
          "Unexpected instruction: " + toHex(instructionByte)
        );
      }

      if (typeof instruction.object === "string") {
        dump([instructionByte], `${instruction.object}.${instruction.name}`);
      } else {
        dump([instructionByte], instruction.name);
      }

      /**
       * End of the function
       */
      if (instruction.name === "end") {
        const node = WITH_LOC(t.instruction(instruction.name), startLoc);

        code.push(node);

        break;
      }

      const args = [];

      if (instruction.name === "loop") {
        const startLoc = getPosition();

        const blocktypeByte = readByte();
        eatBytes(1);

        const blocktype = constants.blockTypes[blocktypeByte];

        dump([blocktypeByte], "blocktype");

        if (typeof blocktype === "undefined") {
          throw new CompileError(
            "Unexpected blocktype: " + toHex(blocktypeByte)
          );
        }

        const instr = [];

        parseInstructionBlock(instr);

        // preserve anonymous
        const label = t.withRaw(t.identifier(getUniqueName("loop")), "");
        const loopNode = WITH_LOC(
          t.loopInstruction(label, blocktype, instr),
          startLoc
        );

        code.push(loopNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "if") {
        const startLoc = getPosition();

        const blocktypeByte = readByte();
        eatBytes(1);

        const blocktype = constants.blockTypes[blocktypeByte];

        dump([blocktypeByte], "blocktype");

        if (typeof blocktype === "undefined") {
          throw new CompileError(
            "Unexpected blocktype: " + toHex(blocktypeByte)
          );
        }

        const testIndex = t.withRaw(t.identifier(getUniqueName("if")), "");
        const ifBody = [];
        parseInstructionBlock(ifBody);

        // Defaults to no alternate
        let elseIndex = 0;
        for (elseIndex = 0; elseIndex < ifBody.length; ++elseIndex) {
          const instr = ifBody[elseIndex];
          if (instr.type === "Instr" && instr.id === "else") {
            break;
          }
        }

        const consequentInstr = ifBody.slice(0, elseIndex);
        const alternate = ifBody.slice(elseIndex + 1);

        // wast sugar
        const testInstrs = [];

        const ifNode = WITH_LOC(
          t.ifInstruction(
            testIndex,
            testInstrs,
            blocktype,
            consequentInstr,
            alternate
          ),
          startLoc
        );

        code.push(ifNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "block") {
        const startLoc = getPosition();

        const blocktypeByte = readByte();
        eatBytes(1);

        const blocktype = constants.blockTypes[blocktypeByte];

        dump([blocktypeByte], "blocktype");

        if (typeof blocktype === "undefined") {
          throw new CompileError(
            "Unexpected blocktype: " + toHex(blocktypeByte)
          );
        }

        const instr = [];
        parseInstructionBlock(instr);

        // preserve anonymous
        const label = t.withRaw(t.identifier(getUniqueName("block")), "");

        const blockNode = WITH_LOC(
          t.blockInstruction(label, instr, blocktype),
          startLoc
        );

        code.push(blockNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "call") {
        const indexu32 = readU32();
        const index = indexu32.value;
        eatBytes(indexu32.nextIndex);

        dump([index], "index");

        const callNode = WITH_LOC(
          t.callInstruction(t.indexLiteral(index)),
          startLoc
        );

        code.push(callNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "call_indirect") {
        const startLoc = getPosition();

        const indexU32 = readU32();
        const typeindex = indexU32.value;
        eatBytes(indexU32.nextIndex);

        dump([typeindex], "type index");

        const signature = state.typesInModule[typeindex];

        if (typeof signature === "undefined") {
          throw new CompileError(
            `call_indirect signature not found (${typeindex})`
          );
        }

        const callNode = t.callIndirectInstruction(
          t.signature(signature.params, signature.result),
          []
        );

        const flagU32 = readU32();
        const flag = flagU32.value; // 0x00 - reserved byte
        eatBytes(flagU32.nextIndex);

        if (flag !== 0) {
          throw new CompileError("zero flag expected");
        }

        code.push(WITH_LOC(callNode, startLoc));
        instructionAlreadyCreated = true;
      } else if (instruction.name === "br_table") {
        const indicesu32 = readU32();
        const indices = indicesu32.value;
        eatBytes(indicesu32.nextIndex);

        dump([indices], "num indices");

        for (let i = 0; i <= indices; i++) {
          const indexu32 = readU32();
          const index = indexu32.value;
          eatBytes(indexu32.nextIndex);

          dump([index], "index");

          args.push(t.numberLiteralFromRaw(indexu32.value.toString(), "u32"));
        }
      } else if (instructionByte >= 0x28 && instructionByte <= 0x40) {
        /**
         * Memory instructions
         */

        if (
          instruction.name === "grow_memory" ||
          instruction.name === "current_memory"
        ) {
          const indexU32 = readU32();
          const index = indexU32.value;
          eatBytes(indexU32.nextIndex);

          if (index !== 0) {
            throw new Error("zero flag expected");
          }

          dump([index], "index");
        } else {
          const aligun32 = readU32();
          const align = aligun32.value;
          eatBytes(aligun32.nextIndex);

          dump([align], "align");

          const offsetu32 = readU32();
          const offset = offsetu32.value;
          eatBytes(offsetu32.nextIndex);

          dump([offset], "offset");
        }
      } else if (instructionByte >= 0x41 && instructionByte <= 0x44) {
        /**
         * Numeric instructions
         */
        if (instruction.object === "i32") {
          const value32 = read32();
          const value = value32.value;
          eatBytes(value32.nextIndex);

          dump([value], "i32 value");

          args.push(t.numberLiteralFromRaw(value));
        }

        if (instruction.object === "u32") {
          const valueu32 = readU32();
          const value = valueu32.value;
          eatBytes(valueu32.nextIndex);

          dump([value], "u32 value");

          args.push(t.numberLiteralFromRaw(value));
        }

        if (instruction.object === "i64") {
          const value64 = read64();
          const value = value64.value;
          eatBytes(value64.nextIndex);

          dump([Number(value.toString())], `i64 value`);

          const { high, low } = value;

          const node = {
            type: "LongNumberLiteral",
            value: { high, low }
          };

          args.push(node);
        }

        if (instruction.object === "u64") {
          const valueu64 = readU64();
          const value = valueu64.value;
          eatBytes(valueu64.nextIndex);

          dump([Number(value.toString())], "u64 value");

          const { high, low } = value;

          const node = {
            type: "LongNumberLiteral",
            value: { high, low }
          };

          args.push(node);
        }

        if (instruction.object === "f32") {
          const valuef32 = readF32();
          const value = valuef32.value;
          eatBytes(valuef32.nextIndex);

          dump([value], "f32 value");

          args.push(
            // $FlowIgnore
            t.floatLiteral(value, valuef32.nan, valuef32.inf, String(value))
          );
        }

        if (instruction.object === "f64") {
          const valuef64 = readF64();
          const value = valuef64.value;
          eatBytes(valuef64.nextIndex);

          dump([value], "f64 value");

          args.push(
            // $FlowIgnore
            t.floatLiteral(value, valuef64.nan, valuef64.inf, String(value))
          );
        }
      } else if (instructionByte >= 0xfe00 && instructionByte <= 0xfeff) {
        /**
         * Atomic memory instructions
         */

        const align32 = readU32();
        const align = align32.value;
        eatBytes(align32.nextIndex);

        dump([align], "align");

        const offsetu32 = readU32();
        const offset = offsetu32.value;
        eatBytes(offsetu32.nextIndex);

        dump([offset], "offset");
      } else {
        for (let i = 0; i < instruction.numberOfArgs; i++) {
          const u32 = readU32();
          eatBytes(u32.nextIndex);

          dump([u32.value], "argument " + i);

          args.push(t.numberLiteralFromRaw(u32.value));
        }
      }

      if (instructionAlreadyCreated === false) {
        if (typeof instruction.object === "string") {
          const node = WITH_LOC(
            t.objectInstruction(instruction.name, instruction.object, args),
            startLoc
          );

          code.push(node);
        } else {
          const node = WITH_LOC(
            t.instruction(instruction.name, args),
            startLoc
          );

          code.push(node);
        }
      }
    }
  }

  // https://webassembly.github.io/spec/core/binary/types.html#limits
  function parseLimits(): Limit {
    const limitType = readByte();
    eatBytes(1);
    
    const shared = limitType === 0x03;

    dump([limitType], "limit type" + (shared ? " (shared)" : ""));

    let min, max;

    if (
      limitType === 0x01 ||
      limitType === 0x03 // shared limits
    ) {
      const u32min = readU32();
      min = parseInt(u32min.value);
      eatBytes(u32min.nextIndex);

      dump([min], "min");

      const u32max = readU32();
      max = parseInt(u32max.value);
      eatBytes(u32max.nextIndex);

      dump([max], "max");
    }

    if (limitType === 0x00) {
      const u32min = readU32();
      min = parseInt(u32min.value);
      eatBytes(u32min.nextIndex);

      dump([min], "min");
    }

    return t.limit(min, max, shared);
  }

  // https://webassembly.github.io/spec/core/binary/types.html#binary-tabletype
  function parseTableType(index: number): Table {
    const name = t.withRaw(t.identifier(getUniqueName("table")), String(index));

    const elementTypeByte = readByte();
    eatBytes(1);

    dump([elementTypeByte], "element type");

    const elementType = constants.tableTypes[elementTypeByte];

    if (typeof elementType === "undefined") {
      throw new CompileError(
        "Unknown element type in table: " + toHex(elementType)
      );
    }

    const limits = parseLimits();

    return t.table(elementType, limits, name);
  }

  // https://webassembly.github.io/spec/binary/types.html#global-types
  function parseGlobalType(): GlobalType {
    const valtypeByte = readByte();
    eatBytes(1);

    const type = constants.valtypes[valtypeByte];

    dump([valtypeByte], type);

    if (typeof type === "undefined") {
      throw new CompileError("Unknown valtype: " + toHex(valtypeByte));
    }

    const globalTypeByte = readByte();
    eatBytes(1);

    const globalType = constants.globalTypes[globalTypeByte];

    dump([globalTypeByte], `global type (${globalType})`);

    if (typeof globalType === "undefined") {
      throw new CompileError("Invalid mutability: " + toHex(globalTypeByte));
    }

    return t.globalType(type, globalType);
  }

  // function parseNameModule() {
  //   const lenu32 = readVaruint32();
  //   eatBytes(lenu32.nextIndex);

  //   console.log("len", lenu32);

  //   const strlen = lenu32.value;

  //   dump([strlen], "string length");

  //   const bytes = readBytes(strlen);
  //   eatBytes(strlen);

  //   const value = utf8.decode(bytes);

  //   return [t.moduleNameMetadata(value)];
  // }

  // this section contains an array of function names and indices
  function parseNameSectionFunctions() {
    const functionNames = [];

    const numberOfFunctionsu32 = readU32();
    const numbeOfFunctions = numberOfFunctionsu32.value;
    eatBytes(numberOfFunctionsu32.nextIndex);

    for (let i = 0; i < numbeOfFunctions; i++) {
      const indexu32 = readU32();
      const index = indexu32.value;
      eatBytes(indexu32.nextIndex);

      const name = readUTF8String();
      eatBytes(name.nextIndex);

      functionNames.push(t.functionNameMetadata(name.value, index));
    }

    return functionNames;
  }

  function parseNameSectionLocals() {
    const localNames = [];

    const numbeOfFunctionsu32 = readU32();
    const numbeOfFunctions = numbeOfFunctionsu32.value;
    eatBytes(numbeOfFunctionsu32.nextIndex);

    for (let i = 0; i < numbeOfFunctions; i++) {
      const functionIndexu32 = readU32();
      const functionIndex = functionIndexu32.value;
      eatBytes(functionIndexu32.nextIndex);

      const numLocalsu32 = readU32();
      const numLocals = numLocalsu32.value;
      eatBytes(numLocalsu32.nextIndex);

      for (let i = 0; i < numLocals; i++) {
        const localIndexu32 = readU32();
        const localIndex = localIndexu32.value;
        eatBytes(localIndexu32.nextIndex);

        const name = readUTF8String();
        eatBytes(name.nextIndex);

        localNames.push(
          t.localNameMetadata(name.value, localIndex, functionIndex)
        );
      }
    }
    return localNames;
  }

  // this is a custom section used for name resolution
  // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#name-section
  function parseNameSection(remainingBytes: number) {
    const nameMetadata = [];
    const initialOffset = offset;

    while (offset - initialOffset < remainingBytes) {
      // name_type
      const sectionTypeByte = readVaruint7();
      eatBytes(sectionTypeByte.nextIndex);

      // name_payload_len
      const subSectionSizeInBytesu32 = readVaruint32();
      eatBytes(subSectionSizeInBytesu32.nextIndex);

      switch (sectionTypeByte.value) {
        // case 0: {
        // TODO(sven): re-enable that
        // Current status: it seems that when we decode the module's name
        // no name_payload_len is used.
        //
        // See https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#name-section
        //
        // nameMetadata.push(...parseNameModule());
        // break;
        // }
        case 1: {
          nameMetadata.push(...parseNameSectionFunctions());
          break;
        }
        case 2: {
          nameMetadata.push(...parseNameSectionLocals());
          break;
        }
        default: {
          // skip unknown subsection
          eatBytes(subSectionSizeInBytesu32.value);
        }
      }
    }

    return nameMetadata;
  }

  // this is a custom section used for information about the producers
  // https://github.com/WebAssembly/tool-conventions/blob/master/ProducersSection.md
  function parseProducersSection() {
    const metadata = t.producersSectionMetadata([]);

    // field_count
    const sectionTypeByte = readVaruint32();
    eatBytes(sectionTypeByte.nextIndex);

    dump([sectionTypeByte.value], "num of producers");

    const fields = {
      language: [],
      "processed-by": [],
      sdk: []
    };

    // fields
    for (let fieldI = 0; fieldI < sectionTypeByte.value; fieldI++) {
      // field_name
      const fieldName = readUTF8String();
      eatBytes(fieldName.nextIndex);

      // field_value_count
      const valueCount = readVaruint32();
      eatBytes(valueCount.nextIndex);

      // field_values
      for (let producerI = 0; producerI < valueCount.value; producerI++) {
        const producerName = readUTF8String();
        eatBytes(producerName.nextIndex);

        const producerVersion = readUTF8String();
        eatBytes(producerVersion.nextIndex);

        fields[fieldName.value].push(
          t.producerMetadataVersionedName(
            producerName.value,
            producerVersion.value
          )
        );
      }

      metadata.producers.push(fields[fieldName.value]);
    }

    return metadata;
  }

  function parseGlobalSection(numberOfGlobals: number) {
    const globals = [];

    dump([numberOfGlobals], "num globals");

    for (let i = 0; i < numberOfGlobals; i++) {
      const startLoc = getPosition();

      const globalType = parseGlobalType();

      /**
       * Global expressions
       */
      const init = [];

      parseInstructionBlock(init);

      const node = WITH_LOC(t.global(globalType, init), startLoc);

      globals.push(node);
      state.globalsInModule.push(node);
    }

    return globals;
  }

  function parseElemSection(numberOfElements: number) {
    const elems = [];

    dump([numberOfElements], "num elements");

    for (let i = 0; i < numberOfElements; i++) {
      const startLoc = getPosition();

      const tableindexu32 = readU32();
      const tableindex = tableindexu32.value;
      eatBytes(tableindexu32.nextIndex);

      dump([tableindex], "table index");

      /**
       * Parse instructions
       */
      const instr = [];
      parseInstructionBlock(instr);

      /**
       * Parse ( vector function index ) *
       */
      const indicesu32 = readU32();
      const indices = indicesu32.value;
      eatBytes(indicesu32.nextIndex);

      dump([indices], "num indices");

      const indexValues = [];

      for (let i = 0; i < indices; i++) {
        const indexu32 = readU32();
        const index = indexu32.value;
        eatBytes(indexu32.nextIndex);

        dump([index], "index");

        indexValues.push(t.indexLiteral(index));
      }

      const elemNode = WITH_LOC(
        t.elem(t.indexLiteral(tableindex), instr, indexValues),
        startLoc
      );

      elems.push(elemNode);
    }

    return elems;
  }

  // https://webassembly.github.io/spec/core/binary/types.html#memory-types
  function parseMemoryType(i: number): Memory {
    const limits = parseLimits();

    return t.memory(limits, t.indexLiteral(i));
  }

  // https://webassembly.github.io/spec/binary/modules.html#table-section
  function parseTableSection(numberOfElements: number) {
    const tables = [];

    dump([numberOfElements], "num elements");

    for (let i = 0; i < numberOfElements; i++) {
      const tablesNode = parseTableType(i);

      state.tablesInModule.push(tablesNode);
      tables.push(tablesNode);
    }

    return tables;
  }

  // https://webassembly.github.io/spec/binary/modules.html#memory-section
  function parseMemorySection(numberOfElements: number) {
    const memories = [];

    dump([numberOfElements], "num elements");

    for (let i = 0; i < numberOfElements; i++) {
      const memoryNode = parseMemoryType(i);

      state.memoriesInModule.push(memoryNode);
      memories.push(memoryNode);
    }

    return memories;
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-startsec
  function parseStartSection() {
    const startLoc = getPosition();

    const u32 = readU32();
    const startFuncIndex = u32.value;
    eatBytes(u32.nextIndex);

    dump([startFuncIndex], "index");

    return WITH_LOC(t.start(t.indexLiteral(startFuncIndex)), startLoc);
  }

  // https://webassembly.github.io/spec/binary/modules.html#data-section
  function parseDataSection(numberOfElements: number) {
    const dataEntries = [];

    dump([numberOfElements], "num elements");

    for (let i = 0; i < numberOfElements; i++) {
      const memoryIndexu32 = readU32();
      const memoryIndex = memoryIndexu32.value;
      eatBytes(memoryIndexu32.nextIndex);

      dump([memoryIndex], "memory index");

      const instrs: Array<Instruction> = [];
      parseInstructionBlock(instrs);

      const hasExtraInstrs = instrs.filter(i => i.id !== "end").length !== 1;

      if (hasExtraInstrs) {
        throw new CompileError(
          "data section offset must be a single instruction"
        );
      }

      const bytes: Array<Byte> = parseVec(b => b);

      dump([], "init");

      dataEntries.push(
        t.data(t.memIndexLiteral(memoryIndex), instrs[0], t.byteArray(bytes))
      );
    }

    return dataEntries;
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-section
  function parseSection(
    sectionIndex: number
  ): {
    nodes: Array<Node>,
    metadata: SectionMetadata | Array<SectionMetadata>,
    nextSectionIndex: number
  } {
    const sectionId = readByte();
    eatBytes(1);

    if (
      sectionId >= sectionIndex ||
      sectionIndex === constants.sections.custom
    ) {
      sectionIndex = sectionId + 1;
    } else {
      if (sectionId !== constants.sections.custom)
        throw new CompileError("Unexpected section: " + toHex(sectionId));
    }

    const nextSectionIndex = sectionIndex;

    const startOffset = offset;
    const startLoc = getPosition();

    const u32 = readU32();
    const sectionSizeInBytes = u32.value;
    eatBytes(u32.nextIndex);

    const sectionSizeInBytesNode = WITH_LOC(
      t.numberLiteralFromRaw(sectionSizeInBytes),
      startLoc
    );

    switch (sectionId) {
      case constants.sections.type: {
        dumpSep("section Type");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const u32 = readU32();
        const numberOfTypes = u32.value;
        eatBytes(u32.nextIndex);

        const metadata = t.sectionMetadata(
          "type",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfTypes), startLoc)
        );

        const nodes = parseTypeSection(numberOfTypes);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.table: {
        dumpSep("section Table");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const u32 = readU32();
        const numberOfTable = u32.value;
        eatBytes(u32.nextIndex);

        dump([numberOfTable], "num tables");

        const metadata = t.sectionMetadata(
          "table",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfTable), startLoc)
        );

        const nodes = parseTableSection(numberOfTable);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.import: {
        dumpSep("section Import");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const numberOfImportsu32 = readU32();
        const numberOfImports = numberOfImportsu32.value;
        eatBytes(numberOfImportsu32.nextIndex);

        dump([numberOfImports], "number of imports");

        const metadata = t.sectionMetadata(
          "import",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfImports), startLoc)
        );

        const nodes = parseImportSection(numberOfImports);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.func: {
        dumpSep("section Function");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const numberOfFunctionsu32 = readU32();
        const numberOfFunctions = numberOfFunctionsu32.value;
        eatBytes(numberOfFunctionsu32.nextIndex);

        const metadata = t.sectionMetadata(
          "func",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfFunctions), startLoc)
        );

        parseFuncSection(numberOfFunctions);

        const nodes = [];

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.export: {
        dumpSep("section Export");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const u32 = readU32();
        const numberOfExport = u32.value;
        eatBytes(u32.nextIndex);

        const metadata = t.sectionMetadata(
          "export",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfExport), startLoc)
        );

        parseExportSection(numberOfExport);

        const nodes = [];

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.code: {
        dumpSep("section Code");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const u32 = readU32();
        const numberOfFuncs = u32.value;
        eatBytes(u32.nextIndex);

        const metadata = t.sectionMetadata(
          "code",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfFuncs), startLoc)
        );

        if (opts.ignoreCodeSection === true) {
          const remainingBytes = sectionSizeInBytes - u32.nextIndex;

          eatBytes(remainingBytes); // eat the entire section
        } else {
          parseCodeSection(numberOfFuncs);
        }

        const nodes = [];

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.start: {
        dumpSep("section Start");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const metadata = t.sectionMetadata(
          "start",
          startOffset,
          sectionSizeInBytesNode
        );

        const nodes = [parseStartSection()];

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.element: {
        dumpSep("section Element");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const numberOfElementsu32 = readU32();
        const numberOfElements = numberOfElementsu32.value;
        eatBytes(numberOfElementsu32.nextIndex);

        const metadata = t.sectionMetadata(
          "element",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfElements), startLoc)
        );

        const nodes = parseElemSection(numberOfElements);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.global: {
        dumpSep("section Global");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const numberOfGlobalsu32 = readU32();
        const numberOfGlobals = numberOfGlobalsu32.value;
        eatBytes(numberOfGlobalsu32.nextIndex);

        const metadata = t.sectionMetadata(
          "global",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfGlobals), startLoc)
        );

        const nodes = parseGlobalSection(numberOfGlobals);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.memory: {
        dumpSep("section Memory");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const startLoc = getPosition();

        const numberOfElementsu32 = readU32();
        const numberOfElements = numberOfElementsu32.value;
        eatBytes(numberOfElementsu32.nextIndex);

        const metadata = t.sectionMetadata(
          "memory",
          startOffset,
          sectionSizeInBytesNode,
          WITH_LOC(t.numberLiteralFromRaw(numberOfElements), startLoc)
        );

        const nodes = parseMemorySection(numberOfElements);

        return { nodes, metadata, nextSectionIndex };
      }

      case constants.sections.data: {
        dumpSep("section Data");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const metadata = t.sectionMetadata(
          "data",
          startOffset,
          sectionSizeInBytesNode
        );

        const startLoc = getPosition();

        const numberOfElementsu32 = readU32();
        const numberOfElements = numberOfElementsu32.value;
        eatBytes(numberOfElementsu32.nextIndex);

        metadata.vectorOfSize = WITH_LOC(
          t.numberLiteralFromRaw(numberOfElements),
          startLoc
        );

        if (opts.ignoreDataSection === true) {
          const remainingBytes =
            sectionSizeInBytes - numberOfElementsu32.nextIndex;

          eatBytes(remainingBytes); // eat the entire section

          dumpSep("ignore data (" + sectionSizeInBytes + " bytes)");

          return { nodes: [], metadata, nextSectionIndex };
        } else {
          const nodes = parseDataSection(numberOfElements);
          return { nodes, metadata, nextSectionIndex };
        }
      }

      case constants.sections.custom: {
        dumpSep("section Custom");
        dump([sectionId], "section code");
        dump([sectionSizeInBytes], "section size");

        const metadata = [
          t.sectionMetadata("custom", startOffset, sectionSizeInBytesNode)
        ];

        const sectionName = readUTF8String();
        eatBytes(sectionName.nextIndex);

        dump([], `section name (${sectionName.value})`);

        const remainingBytes = sectionSizeInBytes - sectionName.nextIndex;

        if (sectionName.value === "name") {
          const initialOffset = offset;

          try {
            metadata.push(...parseNameSection(remainingBytes));
          } catch (e) {
            console.warn(
              `Failed to decode custom "name" section @${offset}; ignoring (${
                e.message
              }).`
            );

            eatBytes(offset - (initialOffset + remainingBytes));
          }
        } else if (sectionName.value === "producers") {
          const initialOffset = offset;

          try {
            metadata.push(parseProducersSection());
          } catch (e) {
            console.warn(
              `Failed to decode custom "producers" section @${offset}; ignoring (${
                e.message
              }).`
            );

            eatBytes(offset - (initialOffset + remainingBytes));
          }
        } else {
          // We don't parse the custom section
          eatBytes(remainingBytes);

          dumpSep(
            "ignore custom " +
              JSON.stringify(sectionName.value) +
              " section (" +
              remainingBytes +
              " bytes)"
          );
        }

        return { nodes: [], metadata, nextSectionIndex };
      }
    }

    throw new CompileError("Unexpected section: " + toHex(sectionId));
  }

  parseModuleHeader();
  parseVersion();

  const moduleFields = [];
  let sectionIndex = 0;
  const moduleMetadata = {
    sections: [],
    functionNames: [],
    localNames: [],
    producers: []
  };

  /**
   * All the generate declaration are going to be stored in our state
   */
  while (offset < buf.length) {
    const { nodes, metadata, nextSectionIndex } = parseSection(sectionIndex);

    moduleFields.push(...nodes);

    const metadataArray = Array.isArray(metadata) ? metadata : [metadata];
    metadataArray.forEach(metadataItem => {
      if (metadataItem.type === "FunctionNameMetadata") {
        moduleMetadata.functionNames.push(metadataItem);
      } else if (metadataItem.type === "LocalNameMetadata") {
        moduleMetadata.localNames.push(metadataItem);
      } else if (metadataItem.type === "ProducersSectionMetadata") {
        moduleMetadata.producers.push(metadataItem);
      } else {
        moduleMetadata.sections.push(metadataItem);
      }
    });
    // Ignore custom section
    if (nextSectionIndex) {
      sectionIndex = nextSectionIndex;
    }
  }

  /**
   * Transform the state into AST nodes
   */
  let funcIndex = 0;
  state.functionsInModule.forEach((func: DecodedModuleFunc) => {
    const params = func.signature.params;
    const result = func.signature.result;

    let body = [];

    // External functions doesn't provide any code, can skip it here
    if (func.isExternal === true) {
      return;
    }

    const decodedElementInCodeSection = state.elementsInCodeSection[funcIndex];

    if (opts.ignoreCodeSection === false) {
      if (typeof decodedElementInCodeSection === "undefined") {
        throw new CompileError("func " + toHex(funcIndex) + " code not found");
      }

      body = decodedElementInCodeSection.code;
    }

    funcIndex++;

    let funcNode = t.func(func.id, t.signature(params, result), body);

    if (func.isExternal === true) {
      funcNode.isExternal = func.isExternal;
    }

    // Add function position in the binary if possible
    if (opts.ignoreCodeSection === false) {
      const { startLoc, endLoc, bodySize } = decodedElementInCodeSection;

      funcNode = t.withLoc(funcNode, endLoc, startLoc);
      funcNode.metadata = { bodySize };
    }

    moduleFields.push(funcNode);
  });

  state.elementsInExportSection.forEach(
    (moduleExport: DecodedElementInExportSection) => {
      /**
       * If the export has no id, we won't be able to call it from the outside
       * so we can omit it
       */
      if (moduleExport.id != null) {
        moduleFields.push(
          t.withLoc(
            t.moduleExport(
              moduleExport.name,
              t.moduleExportDescr(moduleExport.type, moduleExport.id)
            ),
            moduleExport.endLoc,
            moduleExport.startLoc
          )
        );
      }
    }
  );

  dumpSep("end of program");

  const module = t.module(
    null,
    moduleFields,
    t.moduleMetadata(
      moduleMetadata.sections,
      moduleMetadata.functionNames,
      moduleMetadata.localNames,
      moduleMetadata.producers
    )
  );
  return t.program([module]);
}
