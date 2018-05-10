const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { assert } = require("chai");
const { decode } = require("@webassemblyjs/wasm-parser");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const constants = require("@webassemblyjs/helper-wasm-bytecode");
const { getSectionMetadata } = require("@webassemblyjs/ast");

const {
  resizeSectionVecSize,
  resizeSectionByteSize,
  createEmptySection,
  removeSection
} = require("../lib");

const section = "import";

describe("create", () => {
  it("should create an empty import section in buffer", () => {
    const sectionName = "import";
    const actual = new Uint8Array(makeBuffer(encodeHeader(), encodeVersion(1)));

    const expected = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x01, 0x00]
      )
    );

    const ast = decode(actual);

    const res = createEmptySection(ast, actual, sectionName);

    // assert new buffer
    assert.deepEqual(res.uint8Buffer, expected);

    // assert associated section metadata
    assert.equal(res.sectionMetadata.type, "SectionMetadata");
    assert.equal(res.sectionMetadata.section, sectionName);
    assert.equal(res.sectionMetadata.startOffset, 9);

    // section byte size
    assert.equal(res.sectionMetadata.size.value, 1);
    assert.equal(res.sectionMetadata.size.loc.start.column, 9);
    assert.equal(res.sectionMetadata.size.loc.end.column, 10);

    // section vector size
    assert.equal(res.sectionMetadata.vectorOfSize.value, 0);
    assert.equal(res.sectionMetadata.vectorOfSize.loc.start.column, 10);
    assert.equal(res.sectionMetadata.vectorOfSize.loc.end.column, 11);
  });

  it("should create an section and preserve section order", () => {
    const sectionName = "func";

    const actual = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x01, 0x00],
        [constants.sections.import, 0x01, 0x00],
        [constants.sections.global, 0x01, 0x00]
      )
    );

    const expected = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x01, 0x00],
        [constants.sections.import, 0x01, 0x00],
        [constants.sections.func, 0x01, 0x00],
        [constants.sections.global, 0x01, 0x00]
      )
    );

    const ast = decode(actual);
    const res = createEmptySection(ast, actual, sectionName);

    assert.deepEqual(res.uint8Buffer, expected);
  });

  it("should shift following section", () => {
    const actual = new Uint8Array(
      makeBuffer(encodeHeader(), encodeVersion(1), [
        constants.sections.global,
        0x01,
        0x00
      ])
    );

    const ast = decode(actual);
    createEmptySection(ast, actual, "type");

    // should have updated ast
    assert.equal(12, getSectionMetadata(ast, "global").startOffset);
    assert.equal(9, getSectionMetadata(ast, "type").startOffset);
  });
});

describe("resize", () => {
  it("should update section size in bytes", () => {
    const actual = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x01, 0x00]
      )
    );

    const ast = decode(actual);
    const deltaBytes = +4;

    const newBinary = resizeSectionByteSize(ast, actual, section, deltaBytes);

    const expectedBinary = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x05, 0x00]
      )
    );

    assert.deepEqual(newBinary, expectedBinary);
  });

  it("should update section vector size", () => {
    const actual = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x01, 0x00]
      )
    );

    const ast = decode(actual);
    const deltaElements = +4;

    const newBinary = resizeSectionVecSize(ast, actual, section, deltaElements);

    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      /* Import section */ [0x02, 0x01, 0x04]
    );

    assert.deepEqual(new Uint8Array(newBinary), new Uint8Array(expectedBinary));
  });

  it("should shift following sections", () => {
    const actual = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x01, 0x00],
        /* _global section */ [0x06, 0x00]
      )
    );

    const ast = decode(actual);
    const deltaBytes = +4;

    const newBinary = resizeSectionByteSize(ast, actual, section, deltaBytes);

    const expectedBinary = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        /* Import section */ [0x02, 0x05, 0x00],
        /* _global section */ [0x06, 0x00]
      )
    );

    assert.deepEqual(newBinary, expectedBinary);

    // should have updated ast
    const globalSection = getSectionMetadata(ast, "global");

    assert.equal(12 + 4, globalSection.startOffset);
    assert.equal(12 + 4, globalSection.size.loc.start.column);
    assert.equal(13 + 4, globalSection.vectorOfSize.loc.start.column);
  });
});

describe("remove", () => {
  it("should remove the start section", () => {
    const sectionName = "start";

    const actual = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
        [constants.sections.func, 0x02, 0x01, 0x00],
        [constants.sections.start, 0x01, 0x00],
        [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
      )
    );

    const expected = new Uint8Array(
      makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
        [constants.sections.func, 0x02, 0x01, 0x00],
        [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
      )
    );

    const ast = decode(actual);
    const newBin = removeSection(ast, actual, sectionName);

    // should have updated ast
    const code = getSectionMetadata(ast, "code");

    assert.equal(19, code.startOffset);
    assert.equal(19, code.size.loc.start.column);
    assert.equal(20, code.vectorOfSize.loc.start.column);

    assert.deepEqual(newBin, expected);
  });
});
