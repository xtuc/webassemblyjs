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

describe("remove a node", () => {
  it("should remove the ModuleExport", () => {
    // (module
    //   (memory 0)
    //   (export "m" (memory 0))
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [5, 0x03, 0x01, 0x00, 0x00],
      [7, 0x05, 0x01, 0x01, 0x6d, 0x02, 0x00]
    );

    const newBinary = replaceInBinary(actualBinary, {
      ModuleExport(path) {
        path.remove();
      }
    });

    // (module
    //   (memory 0)
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [5, 0x03, 0x01, 0x00, 0x00],
      /*empty export section*/ [7, 0x01, 0x00]
    );

    assertArrayBufferEqual(newBinary, expectedBinary);
  });
});
