const {
  encodeVersion,
  encodeHeader,
  encodeU32,
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const {
  compareArrayBuffers,
} = require("@webassemblyjs/helper-buffer/lib/compare");
const constants = require("@webassemblyjs/helper-wasm-bytecode").default;

const { edit } = require("../lib");

describe("resize handling", () => {
  it("should update node locs after changing length of encoded section size", () => {
    const numExports = 20;
    let expVec1 = [numExports];
    // 20 exports * 8 bytes per export = 160 bytes
    // So long enough that the LEB-encoded section size takes two bytes.
    for (let i = 0; i < numExports; i++) {
      // (export "exp00" (func 0))
      // (export "exp01" (func 0))
      // etc.
      const exp = [0x05, 0x65, 0x78, 0x70]
        .concat(padUTF8Num(i, 2))
        .concat(0x00, 0x00);
      expVec1 = expVec1.concat(exp);
    }

    const expSectionSize1 = encodeU32(expVec1.length);

    // (module
    //   (func)
    //   (export "exp00" (func 0))
    //   (export "exp01" (func 0))
    //   etc.
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.export, ...expSectionSize1, ...expVec1],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    /**
     * Phase 1. Shorten all export names and compare.
     */

    // Shortened export names; 20 exports * 5 bytes per export = 100 bytes.
    // So short enough LEB-encoded section size now only takes 1 byte.
    const newBinary1 = edit(actualBinary, {
      ModuleExport(path) {
        path.node.name = path.node.name.slice(3);
      },
    });

    let expVec2 = [numExports];
    for (let i = 0; i < numExports; i++) {
      // (export "00" (func 0))
      // (export "01" (func 0))
      // etc.
      const exp = [0x02].concat(padUTF8Num(i, 2)).concat(0x00, 0x00);
      expVec2 = expVec2.concat(exp);
    }

    const expSectionSize2 = encodeU32(expVec2.length);

    // (module
    //   (func)
    //   (export "00" (func 0))
    //   (export "01" (func 0))
    //   etc.
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.export, ...expSectionSize2, ...expVec2],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    compareArrayBuffers(newBinary1, expectedBinary);

    /**
     * Phase 2. Lengthen export names and compare to original.
     */

    const newBinary2 = edit(expectedBinary, {
      ModuleExport(path) {
        path.node.name = "exp" + path.node.name;
      },
    });

    compareArrayBuffers(newBinary2, actualBinary);
  });

  it("should update byte size and node locs after changing length of encoded vec size", () => {
    // Just high enough that the encoded vec length takes 2 bytes
    const numExports = 128;
    let expVec1 = encodeU32(numExports);
    for (let i = 0; i < numExports; i++) {
      // (export "exp000" (func 0))
      // (export "exp001" (func 0))
      // etc.
      const exp = [0x06, 0x65, 0x78, 0x70]
        .concat(padUTF8Num(i, 3))
        .concat(0x00, 0x00);
      expVec1 = expVec1.concat(exp);
    }

    const expSectionSize1 = encodeU32(expVec1.length);

    // (module
    //   (func)
    //   (export "exp000" (func 0))
    //   (export "exp001" (func 0))
    //   etc.
    // )
    const actualBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.export, ...expSectionSize1, ...expVec1],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    // Remove first node, then rename others
    let i = 0;
    const newBinary = edit(actualBinary, {
      ModuleExport(path) {
        if (i++) {
          path.node.name = path.node.name.slice(1);
        } else {
          path.remove();
        }
      },
    });

    let expVec2 = encodeU32(numExports - 1);
    for (let i = 1; i < numExports; i++) {
      // (export "xp001" (func 0))
      // (export "xp002" (func 0))
      // etc.
      const exp = [0x05, 0x78, 0x70]
        .concat(padUTF8Num(i, 3))
        .concat(0x00, 0x00);
      expVec2 = expVec2.concat(exp);
    }

    const expSectionSize2 = encodeU32(expVec2.length);

    // (module
    //   (func)
    //   (export "xp001" (func 0))
    //   (export "xp002" (func 0))
    //   etc.
    // )
    const expectedBinary = makeBuffer(
      encodeHeader(),
      encodeVersion(1),
      [constants.sections.type, 0x04, 0x01, 0x60, 0x00, 0x00],
      [constants.sections.func, 0x02, 0x01, 0x00],
      [constants.sections.export, ...expSectionSize2, ...expVec2],
      [constants.sections.code, 0x04, 0x01, 0x02, 0x00, 0x0b]
    );

    compareArrayBuffers(newBinary, expectedBinary);
  });
});

// e.g. "000", "001", "002", etc.
// num -- a non-negative integer to format
// digits -- a positive integer for the number of digits
function padUTF8Num(num, digits) {
  return ("0".repeat(digits - 1) + num)
    .slice(-digits)
    .split("")
    .map((c) => c.charCodeAt(0));
}
