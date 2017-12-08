// @flow

const {
  symbols,
  types,
  magicModuleHeader,
  valtypes,
  moduleVersion,
  sections,
} = require('./op-constants');
const {decode} = require('./LEB128');

console.log(decode(Buffer.from([0x08])).value.toJSON());
console.log(decode(Buffer.from([0xE5, 0x8E, 0x26])).value.toJSON());

type Byte = number;

// FIXME(sven): find a better way. Uint32Array needs to be polyfiled.
function byteToUi32(b: Byte): number {
  return (new Uint32Array([b]))[0];
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

export function tokenize(buf: Buffer) {
  const tokens = [];
  let offset = 0;

  function debug(msg: string) {
    console.log('at #', offset + 1, ':', msg);
  }

  /**
   * TODO(sven): we can atually use a same structure
   * we are adding incrementally new features
   */
  const state = {
    elementsInTypeSection: [],
    elementsInFuncSection: [],
    elementsInExportSection: [],
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
    const length = byteToUi32(readByte());
    eatBytes(1);

    debug('parse vec of ' + length);

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
  function parseImportSection() {}

  // Function section
  // https://webassembly.github.io/spec/binary/modules.html#function-section
  function parseFuncSection() {
    debug('parse section func');

    const indices: Array<number> = parseVec(byteToUi32);

    indices.forEach((index: number) => {
      const signature = state.elementsInTypeSection[index];

      if (typeof signature === 'undefined') {
        throw new Error('Internal error: function signature not found');
      }

      state.elementsInFuncSection.push({
        signature,
      });
    });
  }

  // Export section
  // https://webassembly.github.io/spec/binary/modules.html#export-section
  function parseExportSection() {
    debug('parse section export');

    const numberOfExport = byteToUi32(readByte());
    eatBytes(1);

    debug(numberOfExport + ' export(s)');

    // Parse vector of exports
    for (let i = 0; i < numberOfExport; i++) {

      const nameStringLength = byteToUi32(readByte());
      eatBytes(1);

      const nameByteArray = readBytes(nameStringLength);
      eatBytes(nameStringLength);

      const name = String.fromCharCode(...nameByteArray);

      const type = readByte();
      eatBytes(1);

      const index = readByte();
      eatBytes(1);

      const signature = state.elementsInTypeSection[index];

      if (typeof signature === 'undefined') {
        throw new Error('Internal error: function signature not found');
      }

      state.elementsInExportSection.push({
        name,
        type,
        signature,
        index,
      });

    }
  }

  // Code section
  // https://webassembly.github.io/spec/binary/modules.html#code-section
  function parseCodeSection() {
    debug('parse section code');

    const numberOfFuncs = byteToUi32(readByte());
    eatBytes(1);

    debug(numberOfFuncs + ' function(s)');

    // Parse vector of function
    for (let i = 0; i < numberOfFuncs; i++) {
      const numberOfDecl = readByte();
      eatBytes(1);

      const locals: Array<Valtype> = parseVec((b) => valtypes[b]);
      const code = [];

      for (let i = 0; i < numberOfDecl; i++) {
        const instructionByte = readByte();
        eatBytes(1);

        const instruction = symbols[instructionByte];

        if (typeof instruction === 'undefined') {
          throw new Error('Unexpected instruction: ' + instructionByte);
        }

        // FIXME(sven): test if the instruction has args before that
        const arg = byteToUi32(readByte());
        eatBytes(1);

        console.log(instruction, arg);
      }

    }
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-section
  function parseSection() {
    const sectionId = readByte();
    eatBytes(1);

    debug('start parse section ' + sectionId);

    /**
     * The size of the section can be ignore, see
     * https://github.com/WebAssembly/spec/issues/620, it's one byte.
     */
    eatBytes(1);

    switch (sectionId) {

    case sections.typeSection: {
      const numberOfTypes = byteToUi32(readByte());
      eatBytes(1);

      parseTypeSection(numberOfTypes);
      break;
    }

    case sections.importSection: {
      throw new Error('importSection not implemented yet');
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

  while (offset < buf.length) {
    parseSection();
  }

  return tokens;
}
