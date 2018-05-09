const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const t = require("@webassemblyjs/ast");
const {
  compareArrayBuffers
} = require("@webassemblyjs/helper-buffer/lib/compare");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

const { add, edit } = require("../lib");

function callIndirectInstructionIndex(index) {
  return {
    type: "CallIndirectInstruction",
    index
  };
}

describe("replace a node", () => {
  it("should replace the ModuleImport", () => {
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [0x02, 0x08, 0x01, 0x01, 0x6d, 0x01, 0x61, 0x03],
      [0x7f, 0x00]
    );

    const newBinary = edit(actualBinary, {
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

    compareArrayBuffers(newBinary, expectedBinary);
  });

  it("should replace the ModuleImport with a new FuncImportDescr", () => {
    // (module
    //   (global $a.b (import "a" "b") i32)
    // )
    let actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.import, 0x08, 0x01, 0x01, 0x61, 0x01, 0x62, 0x03],
      [0x7f, 0x00]
    );

    const funcType = t.typeInstructionFunc([], ["i32"]);
    const funcTypeIndex = t.indexLiteral(0); // we have only one type

    // Add func type to have a valid wasm
    actualBinary = add(actualBinary, [funcType]);

    actualBinary = edit(actualBinary, {
      ModuleImport({ node }) {
        node.descr = t.funcImportDescr(
          funcTypeIndex,
          funcType.functype.params,
          funcType.functype.results
        );
      }
    });

    // (module
    //   (func $a.b (import "a" "b") (result i32))
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f],
      [constants.sections.import, 0x07, 0x01, 0x01, 0x61, 0x01, 0x62, 0x00],
      [0x00]
    );

    compareArrayBuffers(actualBinary, expectedBinary);
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

    const newBinary = edit(actualBinary, {
      Instr(path) {
        if (path.node.id === "get_global") {
          const newNode = t.callInstruction(t.indexLiteral(0));
          path.replaceWith(newNode);
        }
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

    compareArrayBuffers(newBinary, expectedBinary);
  });

  it("should replace the Instruction to a CallIndirectInstruction (and resize func body size)", () => {
    // (module
    //   (global i32 (i32.const 1))
    //   (func (result i32)
    //     (get_global 0)
    //   )
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.global, 0x06, 0x01, 0x7f, 0x00, 0x41, 0x01, 0x0b],
      [constants.sections.code, 0x06, 0x01, 0x04, 0x00, 0x23, 0x00, 0x0b]
    );

    const newBinary = edit(actualBinary, {
      Instr(path) {
        if (path.node.id === "get_global") {
          const newNode = callIndirectInstructionIndex(t.indexLiteral(0));
          path.replaceWith(newNode);
        }
      }
    });

    // (module
    //   (global i32 (i32.const 1))
    //   (func (result i32)
    //     (call_indirect (i32.const 0))
    //   )
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.global, 0x06, 0x01, 0x7f, 0x00, 0x41, 0x01, 0x0b],
      [constants.sections.code, 0x07, 0x01, 0x05, 0x00, 0x11, 0x00, 0x00, 0x0b]
    );

    compareArrayBuffers(newBinary, expectedBinary);
  });

  it("should update all TypeInstructions (implies updating the underlying AST)", () => {
    // (module
    //   (type $a (func (result i32)))
    //   (type $b (func (result i32)))
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x09, 0x02, 0x60, 0x00, 0x01, 0x7f],
      [0x60, 0x00, 0x01, 0x7f]
    );

    const newBinary = edit(actualBinary, {
      TypeInstruction(path) {
        const params = [
          t.funcParam("i32"),
          t.funcParam("i32"),
          t.funcParam("i32"),
          t.funcParam("i32")
        ];

        const results = [];

        const newNode = t.typeInstructionFunc(params, results);
        path.replaceWith(newNode);
      }
    });

    // (module
    //   (type $a (func (param i32 i32 i32) (result i32)))
    //   (type $b (func (param i32 i32 i32) (result i32)))
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x0f, 0x02, 0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f],
      [0x00, 0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f, 0x00]
    );

    compareArrayBuffers(newBinary, expectedBinary);
  });
});
