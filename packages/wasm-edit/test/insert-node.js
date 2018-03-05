const { assert } = require("chai");
const t = require("@webassemblyjs/ast");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

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
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.export, 0x05, 0x01, 0x01, 0x61, 0x00, 0x00],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    it("should insert the node with existing empty section", () => {
      // (module
      //   (func)
      // )
      const actual = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
        [constants.sections.func, 0x02, 0x01, 0x00],
        [constants.sections.export, 0x01, 0x00],
        [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
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
        [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
        [constants.sections.func, 0x02, 0x01, 0x00],
        [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
      );

      const newBinary = add(actual, [
        t.moduleExport("a", "Func", t.indexLiteral(0))
      ]);

      assertArrayBufferEqual(newBinary, expectedBinary);
    });

    it("should export a function in WebAssembly", function() {
      if (typeof WebAssembly === "undefined") {
        console.warn("WebAssembly not available; skiping test");
        return this.skip();
      }

      // (module
      //   (func)
      // )
      const actual = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
        [constants.sections.func, 0x02, 0x01, 0x00],
        [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
      );

      const newBinary = add(actual, [
        t.moduleExport("a", "Func", t.indexLiteral(0))
      ]);

      return WebAssembly.instantiate(newBinary).then(m => {
        assert.isOk(m.instance.exports.a);
        assert.typeOf(m.instance.exports.a, "function");
      });
    });
  });
});
