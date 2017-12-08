// @flow

const {
  symbols,
  types,
  magicModuleHeader,
  valtypes,
  moduleVersion,
  sections,
} = require('./op-constants');

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

  const state = {
    elementsInTypeSection: [],
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

    eatBytes(4);
  }

  function parseVersion() {
    const version = readBytes(4);

    if (byteArrayEq(moduleVersion, version) === false) {
      throw new Error('unknown wasm version: ' + version.join(' '));
    }

    eatBytes(4);
  }

  function parseVec<T>(cast: (Byte) => T): Array<T> {

    // Int on 1byte
    const length = byteToUi32(readByte());
    eatBytes(1);

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

    for (let i = 0; i < numberOfTypes; i++) {

      const type = readByte();
      eatBytes(1);

      if (type == types.func) {
        const params: Array<Valtype> = parseVec((b) => valtypes[b]);
        const result: Array<Valtype> = parseVec((b) => valtypes[b]);

        console.log('type', params, '->', result);
        state.elementsInTypeSection.push({});
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
    throw 'f';
    const indices: Array<number> = parseVec(byteToUi32);

    console.log('indices', indices);
  }

  // https://webassembly.github.io/spec/binary/modules.html#binary-section
  function parseSection() {
    console.log('parse section at', offset);

    const sectionId = readByte();
    eatBytes(1);

    console.log('sectionid', sectionId);

    /**
     * The size of the section can be ignore, see
     * https://github.com/WebAssembly/spec/issues/620, it's one byte.
     */
    eatBytes(1);

    if (sectionId === sections.typeSection) {
      const numberOfTypes = byteToUi32(readByte());
      eatBytes(1);

      parseTypeSection(numberOfTypes);
    } else if (sectionId === sections.importSection) {

      throw new Error('importSection not implemented yet');

    } else if (sectionId === sections.funcSection) {
      parseFuncSection();
    } else {
      console.log(offset);
      throw new Error('Unexpected section: ' + JSON.stringify(sectionId));
    }

    // FIXUP section size
    // Ignore it for now
    eatBytes(1);
  }

  parseModuleHeader();
  parseVersion();

  parseSection();
  parseSection();

  return tokens;
}
