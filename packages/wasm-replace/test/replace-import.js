const { assert } = require("chai");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");

const { replaceInBinary } = require("../lib");

function makeBuffer(...splitedBytes) {
  const bytes = [].concat.apply([], splitedBytes);
  return new Uint8Array(bytes).buffer;
}

function assertArrayBufferEqual(l, r) {
  assert.deepEqual(new Uint8Array(l), new Uint8Array(r));
}

describe("replace an import", () => {
  it("should replace the import", () => {
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x02, 0x08, 0x01, 0x01, 0x6d, 0x01, 0x61, 0x03],
      [0x7f, 0x00]
    );

    const newBinary = replaceInBinary(actualBinary, {
      ModuleImport({ node }) {
        node.module = "foo";
        node.name = "bar";
      }
    });

    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x02, 0x0c, 0x01, 0x03, 0x66, 0x6f, 0x6f, 0x03, 0x62, 0x61, 0x72, 0x03],
      [0x7f, 0x00]
    );

    assertArrayBufferEqual(newBinary, expectedBinary);
  });
});
