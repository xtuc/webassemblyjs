// @flow

const t = require('../../AST');

const {
  symbolsByByte,
  exportTypes,
  types,
  magicModuleHeader,
  valtypes,
  moduleVersion,
  sections,
} = require('./constants');
const {decodeUInt32, MAX_NUMBER_OF_BYTE_U32} = require('./LEB128');

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

  function debug(msg: string) { // eslint-disable-line
    // console.log('at #', offset + 1, ':', msg);
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

    debug('module header');

    eatBytes(4);
  }

  function parseVersion() {
    const version = readBytes(4);

    if (byteArrayEq(moduleVersion, version) === false) {
      throw new Error('unknown wasm version: ' + version.join(' '));
    }

    debug('module version');

    eatBytes(4);
  }

  function parseVec<T>(cast: (Byte) => T): Array<T> {

    // Int on 1byte
    const u32 = readU32();
    const length = u32.value;
    eatBytes(u32.nextIndex);

    debug('parse vec of ' + length + ' elements');

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

      elements.push(value);
    }

    return elements;
  }

  // Type section
  // https://webassembly.github.io/spec/binary/modules.html#binary-typesec
  function parseTypeSection(numberOfTypes: number) {
    debug('parse section type');

    for (let i = 0; i < numberOfTypes; i++) {

      const type = readByte();
      eatBytes(1);

      if (type == types.func) {
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
    debug('parse section func');

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
    debug('parse section export');

    const u32 = readU32();
    const numberOfExport = u32.value;
    eatBytes(u32.nextIndex);

    debug(numberOfExport + ' export(s)');

    // Parse vector of exports
    for (let i = 0; i < numberOfExport; i++) {

      const u32 = readU32();
      const nameStringLength = u32.value;
      eatBytes(u32.nextIndex);

      const nameByteArray = readBytes(nameStringLength);
      eatBytes(nameStringLength);

      const name = String.fromCharCode(...nameByteArray);

      const typeIndex = readByte();
      eatBytes(1);

      const index = readByte();
      eatBytes(1);

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
    debug('parse section code');

    const u32 = readU32();
    const numberOfFuncs = u32.value;
    eatBytes(u32.nextIndex);

    debug(numberOfFuncs + ' function(s)');

    // Parse vector of function
    for (let i = 0; i < numberOfFuncs; i++) {
      debug('start parsing function');

      // Body size of the function, ignore it for now
      const bodySizeU32 = readU32();
      eatBytes(bodySizeU32.nextIndex);

      const locals: Array<Valtype> = parseVec((b) =>  valtypes[b]);
      const code = [];

      // Decode instructions until the end
      while (true) {
        const instructionByte = readByte();
        eatBytes(1);

        const instruction = symbolsByByte[instructionByte];

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

      debug('end parsing function, ' + code.length + ' instruction(s)');
    }
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-section
  function parseSection() {
    const sectionId = readByte();
    eatBytes(1);

    debug('start parse section ' + sectionId);

    /**
     * FIXME(sven): ignore for new the section size
     */
    const u32 = readU32();
    const sectionSize = u32.value; // eslint-disable-line
    eatBytes(u32.nextIndex);

    switch (sectionId) {

    case sections.typeSection: {
      const u32 = readU32();
      const numberOfTypes = u32.value;
      eatBytes(u32.nextIndex);

      parseTypeSection(numberOfTypes);
      break;
    }

    case sections.importSection: {
      parseImportSection();
      break;
    }

    case sections.funcSection: {
      parseFuncSection();
      break;
    }

    case sections.exportSection: {
      parseExportSection();
      break;
    }

    case sections.codeSection: {
      parseCodeSection();
      break;
    }

    default: {
      console.log(offset);
      throw new Error('Unexpected section: ' + JSON.stringify(sectionId));
    }

    }

    debug('end parse section ' + sectionId);
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
