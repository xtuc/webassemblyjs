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
  describe("ModuleImport", () => {
    // (module
    //   (import "a" "b" (memory 1))
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x02, 0x08, 0x01, 0x01, 0x61],
      [0x01, 0x62, 0x02, 0x00, 0x01]
    );

    it("should insert the node with non existing section", () => {
      // (module)
      const actualBinary = makeBuffer(encodeHeader(), encodeVersion(1));

      const newBinary = add(actualBinary, [
        t.moduleImport("a", "b", t.memory(t.limits(1)))
      ]);

      assertArrayBufferEqual(newBinary, expectedBinary);
    });

    it("should insert the node with existing empty section", () => {
      // (module)
      const actualBinary = makeBuffer(encodeHeader(), encodeVersion(1), [
        /* Empty import section*/ 0x02,
        0x01,
        0x00
      ]);

      const newBinary = add(actualBinary, [
        t.moduleImport("a", "b", t.memory(t.limits(1)))
      ]);

      assertArrayBufferEqual(newBinary, expectedBinary);
    });
  });

  describe("ModuleExport", () => {
    // (module
    //   (func)
    //   (export "a" (func 0))
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x01, 0x04, 0x01, 0x60, 0x00, 0x00, 0x03, 0x02, 0x01, 0x00],
      /* code section */ [0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b],
      /* export section */ [0x07, 0x05, 0x01, 0x01, 0x61, 0x00, 0x00]
    );

    it("should insert the node with existing empty section", () => {
      // (module
      //   (func)
      // )
      const actual = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [0x01, 0x04, 0x01, 0x60, 0x00, 0x00],
        [0x03, 0x02, 0x01, 0x00],
        /* code section */ [0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b],
        /* empty export section */ [0x07, 0x01, 0x00]
      );

      const newBinary = add(actual, [
        t.moduleExport("a", "Func", t.indexLiteral(0))
      ]);

      assertArrayBufferEqual(newBinary, expectedBinary);
    });

    it("should insert the node with non existing section", () => {
      // (module
      //   (func)
      // )
      const actual = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [0x01, 0x04, 0x01, 0x60, 0x00, 0x00],
        [0x03, 0x02, 0x01, 0x00],
        [0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b]
      );

      const newBinary = add(actual, [
        t.moduleExport("a", "Func", t.indexLiteral(0))
      ]);

      assertArrayBufferEqual(newBinary, expectedBinary);
    });
  });
});
