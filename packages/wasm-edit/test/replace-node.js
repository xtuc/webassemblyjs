const { assert } = require("chai");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const t = require("@webassemblyjs/ast");
const {decode} = require("@webassemblyjs/wasm-parser");

const { replaceInBinary } = require("../lib");

function assertArrayBufferEqual(l, r) {
  assert.deepEqual(new Uint8Array(l), new Uint8Array(r));
}

describe("replace a node", () => {
  it("should replace the ModuleImport", () => {
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

  it("should replace the Instruction to a CallInstruction", () => {
    // (module
    //   (global i32 (i32.const 1))
    //   (func (result i32)
    //     (get_global 0)
    //   )
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x06],
      [0x06, 0x01, 0x7f, 0x00, 0x41, 0x01, 0x0b, 0x0a, 0x06, 0x01, 0x04, 0x00],
      [/* get_global */ 0x23, 0x00, 0x0b]
    );

    const newBinary = replaceInBinary(actualBinary, {
      Instr(path) {
        const newNode = t.callInstruction(t.indexLiteral(0));
        path.replaceWith(newNode);
      }
    });

    // (module
    //   (global i32 (i32.const 1))
    //   (func (result i32)
    //     (call 0)
    //   )
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),

      [0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x06],
      [0x06, 0x01, 0x7f, 0x00, 0x41, 0x01, 0x0b, 0x0a, 0x06, 0x01, 0x04, 0x00],
      [/* call */ 0x10, 0x00, 0x0b]
    );

    assertArrayBufferEqual(newBinary, expectedBinary);
  });
});
