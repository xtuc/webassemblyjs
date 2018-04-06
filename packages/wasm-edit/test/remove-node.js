const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const {
  compareArrayBuffers
} = require("@webassemblyjs/helper-buffer/lib/compare");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

const { edit } = require("../lib");

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

    const newBinary = edit(actualBinary, {
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
      [constants.sections.memory, 0x03, 0x01, 0x00, 0x00],
      [constants.sections.export, 0x01, 0x00]
    );

    compareArrayBuffers(newBinary, expectedBinary);
  });

  it("should remove the Start", () => {
    // (module
    //   (func)
    //   (start 0)
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.start, 0x01, 0x00],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    const newBinary = edit(actualBinary, {
      Start(path) {
        path.remove();
      }
    });

    // (module
    //   (func)
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    compareArrayBuffers(newBinary, expectedBinary);
  });

  it("should remove all the types (implies updating the underlying AST)", () => {
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
        path.remove();
      }
    });

    // (module)
    const expectedBinary = makeBuffer(encodeHeader(), encodeVersion(1), [
      constants.sections.type,
      0x01,
      0x00
    ]);

    compareArrayBuffers(newBinary, expectedBinary);
  });
});
