const { assert } = require("chai");
const {
  encodeVersion,
  encodeHeader,
  encodeU32,
  encodeUTF8Vec
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const constants = require("@webassemblyjs/helper-wasm-bytecode").default;

const { traverse } = require("@webassemblyjs/ast");

const { decode } = require("../lib");

describe("Binary decoder", () => {
  it("should decode a binary with interspersed custom sections", () => {
    const bin = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      randCustSection("cust1", 1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      randCustSection("cust2", 2),
      [constants.sections.func, 0x02, 0x01, 0x00],
      // include a long custom section name before a standard section to make sure
      // we can skip the correct number of bytes; 5 * 30 = 150, so long enough that
      // the LEB-encoded section name takes 2 bytes
      randCustSection("cust3".repeat(30), 3),
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b],
      randCustSection("cust4", 4)
    );

    // Step 1. Just make sure we can decode the input w/o throwing.
    // That hasn't always been the case for this input.
    const ast = decode(bin);

    // Step 2. As extra sanity check, make sure output AST has the expected sections.
    const sections = findSections(ast);
    assert.deepEqual(sections, [
      "custom",
      "type",
      "custom",
      "func",
      "custom",
      "code",
      "custom"
    ]);
  });

  it("should decode a binary with another custom section after the custom name section", () => {
    const bin = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b],
      // Custom name section that names the 0th func "foo"
      [
        constants.sections.custom,
        0x0d,
        0x04,
        0x6e,
        0x61,
        0x6d,
        0x65,
        0x01,
        0x06,
        0x01,
        0x00,
        0x03,
        0x66,
        0x6f,
        0x6f
      ],
      randCustSection("?", 5)
    );

    // Step 1. Just make sure we can decode the input w/o throwing.
    // That hasn't always been the case for this input.
    const ast = decode(bin);

    // Step 2. As extra sanity check, make sure output AST has the expected sections.
    const sections = findSections(ast);
    assert.deepEqual(sections, ["type", "func", "code", "custom", "custom"]);
  });
});

// Generate a custom section with random contents
function randCustSection(name, contentLength) {
  const contents = [];
  for (let i = 0; i < contentLength; i++) {
    contents.push(Math.floor(Math.random() * 255));
  }

  const nameBytes = encodeUTF8Vec(name),
    secLengthBytes = encodeU32(nameBytes.length + contents.length);

  return [
    constants.sections.custom,
    ...secLengthBytes,
    ...nameBytes,
    ...contents
  ];
}

function findSections(ast) {
  const sections = [];
  traverse(ast, {
    SectionMetadata({ node }) {
      sections.push(node.section);
    }
  });
  return sections;
}
