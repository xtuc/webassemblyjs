const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { assert } = require("chai");
const { decode } = require("@webassemblyjs/wasm-parser");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

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
    assert.equal(res.sectionMetadata.size.value, 1);
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

    assert.deepEqual(newBin, expected);
  });
});
