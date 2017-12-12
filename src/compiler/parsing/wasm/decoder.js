// @flow

const t = require('../../AST');

const {
  symbolsByByte,
  resultTypes,
  tableTypes,
  limitHasMaximum,
  exportTypes,
  types,
  magicModuleHeader,
  valtypes,
  moduleVersion,
  sections,
} = require('./constants');
const {decodeUInt32, MAX_NUMBER_OF_BYTE_U32} = require('./LEB128');

function toHex(n: number): string {
  return '0x' + Number(n).toString('16');
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

export function decode(ab: ArrayBuffer): Program {
  const buf = new Uint8Array(ab);

  let offset = 0;

  function dump(b: Array<Byte>, msg: string) {
    const pad = '\t\t\t\t';
    b = b.map(toHex).join(' ');

    console.log(b, pad, ';', msg);
  }

  function dumpSep(msg: string) {
    console.log(';', msg);
  }

  /**
   * TODO(sven): we can atually use a same structure
   * we are adding incrementally new features
   */
  const state: State = {
    elementsInTypeSection: [],
    elementsInFuncSection: [],
    elementsInExportSection: [],
    elementsInCodeSection: [],
  };

  function eatBytes(n: number) {
    offset = offset + n;
  }

  function readBytes(numberOfBytes: number): Array<Byte> {
    const arr = [];

    for (let i = 0; i < numberOfBytes; i++) {
      arr.push(buf[offset + i]);
    }

    return arr;
  }

  /**
   * Decode an unsigned 32bits integer
   *
   * The length will be handled by the leb librairy, we pass the max number of
   * byte.
   */
  function readU32(): U32 {
    const bytes = readBytes(MAX_NUMBER_OF_BYTE_U32);
    const buffer = Buffer.from(bytes);

    return decodeUInt32(buffer);
  }

  function readByte(): Byte {
    return readBytes(1)[0];
  }

  function parseModuleHeader() {
    const header = readBytes(4);

    if (byteArrayEq(magicModuleHeader, header) === false) {
      throw new Error('magic header not detected');
    }

    dump(header, 'wasm magic: header');

    eatBytes(4);
  }

  function parseVersion() {
    const version = readBytes(4);

    if (byteArrayEq(moduleVersion, version) === false) {
      throw new Error('unknown wasm version: ' + version.join(' '));
    }

    dump(version, 'wasm version');

    eatBytes(4);
  }

  function parseVec<T>(cast: (Byte) => T): Array<T> {

    // Int on 1byte
    const u32 = readU32();
    const length = u32.value;
    eatBytes(u32.nextIndex);

    dump([length], 'number');

    if (length === 0) {
      return [];
    }

    const elements = [];

    for (let i = 0; i < length; i++) {
      const byte = readByte();
      eatBytes(1);

      const value = cast(byte);

      if (typeof value === 'undefined') {
        throw new Error('Internal failure: parseVec could not cast the value');
      }

      dump([byte], value);

      elements.push(value);
    }

    return elements;
  }

  // Type section
  // https://webassembly.github.io/spec/binary/modules.html#binary-typesec
  function parseTypeSection(numberOfTypes: number) {
    dump([numberOfTypes], 'num types');

    for (let i = 0; i < numberOfTypes; i++) {
      dumpSep('type ' + i);

      const type = readByte();
      eatBytes(1);

      if (type == types.func) {
        dump([type], 'func');

        const params: Array<Valtype> = parseVec((b) => valtypes[b]);
        const result: Array<Valtype> = parseVec((b) => valtypes[b]);

        state.elementsInTypeSection.push({
          params,
          result,
        });
      }

      i++;
    }
  }

  // Import section
  // https://webassembly.github.io/spec/binary/modules.html#binary-importsec
  function parseImportSection() {
    throw new Error('Parsing the import section is not implemented yet');
  }

  // Function section
  // https://webassembly.github.io/spec/binary/modules.html#function-section
  function parseFuncSection() {
    const indices: Array<number> = parseVec((x) => x);

    indices
      .map((byte) => {
        const buffer = Buffer.from([byte]);

        return decodeUInt32(buffer).value;
      })
      .forEach((index: number) => {
        const signature = state.elementsInTypeSection[index];

        if (typeof signature === 'undefined') {
          throw new Error('Internal error: function signature not found');
        }

        const id = t.identifier('func_' + index);

        state.elementsInFuncSection.push({
          id,
          signature,
        });
      });
  }

  // Export section
  // https://webassembly.github.io/spec/binary/modules.html#export-section
  function parseExportSection() {
    const u32 = readU32();
    const numberOfExport = u32.value;
    eatBytes(u32.nextIndex);

    dump([numberOfExport], 'num exports');

    // Parse vector of exports
    for (let i = 0; i < numberOfExport; i++) {

      const u32 = readU32();
      const nameStringLength = u32.value;
      eatBytes(u32.nextIndex);

      dump([nameStringLength], 'string length');

      const nameByteArray = readBytes(nameStringLength);
      eatBytes(nameStringLength);

      const name = String.fromCharCode(...nameByteArray);

      dump(nameByteArray, `export name (${name})`);

      const typeIndex = readByte();
      eatBytes(1);

      dump([typeIndex], 'export kind');

      const index = readByte();
      eatBytes(1);

      dump([index], 'export func index');

      const func = state.elementsInFuncSection[index];

      if (typeof func === 'undefined') {
        throw new Error('Internal error: function signature not found in export section');
      }

      state.elementsInExportSection.push({
        name,
        type: exportTypes[typeIndex],
        signature: func.signature,
        id: func.id,
        index,
      });

    }
  }

  // Code section
  // https://webassembly.github.io/spec/binary/modules.html#code-section
  function parseCodeSection() {
    const u32 = readU32();
    const numberOfFuncs = u32.value;
    eatBytes(u32.nextIndex);

    dump([numberOfFuncs], 'number functions');

    // Parse vector of function
    for (let i = 0; i < numberOfFuncs; i++) {

      dumpSep('function body ' + i);

      // Body size of the function, ignore it for now
      const bodySizeU32 = readU32();
      eatBytes(bodySizeU32.nextIndex);

      dump([0x0], 'function body size (guess)');

      const locals: Array<Valtype> = parseVec((b) =>  valtypes[b]);
      const code = [];

      // Decode instructions until the end
      while (true) {
        const instructionByte = readByte();
        eatBytes(1);

        const instruction = symbolsByByte[instructionByte];

        dump([instructionByte], instruction.name);

        if (typeof instruction === 'undefined') {
          throw new Error('Unexpected instruction: ' + instructionByte);
        }

        /**
         * End of the function
         */
        if (instruction.name === 'end') {
          break;
        }

        const args = [];

        for (let i = 0; i < instruction.numberOfArgs; i++) {
          const u32 = readU32();
          eatBytes(u32.nextIndex);

          dump([u32.value], 'local index');

          args.push(u32.value);
        }

        code.push({
          instruction,
          args,
        });
      }

      state.elementsInCodeSection.push({
        code,
        locals,
      });
    }
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-tablesec
  function parseTableSection() {

    const u32 = readU32();
    const numberOfTable = u32.value;
    eatBytes(u32.nextIndex);

    for (let i = 0; i < numberOfTable; i++) {

      const elementType = readByte();
      eatBytes(1);

      if (typeof tableTypes[elementType] === 'undefined') {
        throw new Error('Unknown element type in table: ' + toHex(elementType));
      }

      console.log('element type', elementType);

      const limitType = readByte();
      eatBytes(1);

      if (limitHasMaximum[limitType] === true) {

        const u32min = readU32();
        const min = u32min.value;
        eatBytes(u32min.nextIndex);

        const u32max = readU32();
        const max = u32max.value;
        eatBytes(u32max.nextIndex);

        console.log('table with (min max)', min, max);

      } else {

        const u32min = readU32();
        const min = u32min.value;
        eatBytes(u32min.nextIndex);

        console.log('table with (min)', min);
      }
    }
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-startsec
  function parseStartSection() {

    const u32 = readU32();
    const startFuncIndex = u32.value;
    eatBytes(u32.nextIndex);

    const func = state.elementsInFuncSection[startFuncIndex];

    if (typeof func === 'undefined') {
      throw new Error('Unknown start function');
    }

    console.log('startFuncIndex', startFuncIndex);
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-section
  function parseSection() {
    const sectionId = readByte();
    eatBytes(1);

    const u32 = readU32();
    const sectionSizeInBytes = u32.value;
    eatBytes(u32.nextIndex);

    switch (sectionId) {

    case sections.typeSection: {
      dumpSep('section Type');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      const u32 = readU32();
      const numberOfTypes = u32.value;
      eatBytes(u32.nextIndex);

      parseTypeSection(numberOfTypes);
      break;
    }

    case sections.tableSection: {
      dumpSep('section Table');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseTableSection();
      break;
    }

    case sections.importSection: {
      dumpSep('section Import');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseImportSection();
      break;
    }

    case sections.funcSection: {
      dumpSep('section Function');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseFuncSection();
      break;
    }

    case sections.exportSection: {
      dumpSep('section Export');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseExportSection();
      break;
    }

    case sections.codeSection: {
      dumpSep('section Code');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseCodeSection();
      break;
    }

    case sections.startSection: {
      dumpSep('section Start');
      dump([sectionId], 'section code');
      dump([0x0], 'section size (ignore)');

      parseStartSection();
      break;
    }

    case sections.customSection: {
      // We don't need to parse it, just eat all the bytes
      eatBytes(sectionSizeInBytes);
      break;
    }

    default: {
      throw new Error('Unexpected section: ' + JSON.stringify(sectionId));
    }

    }
  }

  parseModuleHeader();
  parseVersion();

  /**
   * All the generate declaration are going to be stored in our state
   */
  while (offset < buf.length) {
    parseSection();
  }

  /**
   * Transform the state into AST nodes
   */
  const moduleFields = [];

  state.elementsInFuncSection.forEach((func: ElementInFuncSection, funcIndex) => {

    const params = func.signature.params.map((valtype: Valtype) => ({
      valtype,
      id: undefined,
    }));

    const code = state.elementsInCodeSection[funcIndex];

    const body = code.code.map((instr) => {

      if (typeof instr.instruction.object === 'string') {

        return t.objectInstruction(
          instr.instruction.name,
          instr.instruction.object,
          instr.args
        );
      } else {

        return t.instruction(instr.instruction.name, instr.args);
      }
    });

    moduleFields.push(
      t.func(func.id.name, params, func.signature.result[0], body)
    );
  });

  state.elementsInExportSection.forEach((moduleExport: ElementInExportSection) => {

    moduleFields.push(
      t.moduleExport(
        moduleExport.name,
        moduleExport.type,
        moduleExport.id.name,
      )
    );
  });

  const module = t.module(null, moduleFields);
  return t.program([module]);
}
