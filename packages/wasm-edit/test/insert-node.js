const { assert } = require("chai");
const t = require("@webassemblyjs/ast");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");

const { add } = require("../lib");

function assertArrayBufferEqual(l, r) {
  assert.deepEqual(new Uint8Array(l), new Uint8Array(r));
}

describe("insert a node", () => {
  it("should insert the ModuleImport (with non existing import section)", () => {
    // (module)
    const actualBinary = makeBuffer(encodeHeader(), encodeVersion(1));

    const newBinary = add(actualBinary, [
      t.moduleImport("a", "b", t.memory(t.limits(1)))
    ]);

    // (module
    //   (import "a" "b" (memory 1))
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x02, 0x08, 0x01, 0x01, 0x61],
      [0x01, 0x62, 0x02, 0x00, 0x01]
    );

    assertArrayBufferEqual(newBinary, expectedBinary);
  });
});
