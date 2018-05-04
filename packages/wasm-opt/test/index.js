const {
  compareArrayBuffers
} = require("@webassemblyjs/helper-buffer/lib/compare");

const { fromHexdump } = require("@webassemblyjs/helper-buffer");

const opt = require("../lib");

describe("wasm optimizer", () => {
  describe("shrink padded LEB128", () => {
    it("should shrink sections", () => {
      // Empty module with global and type section
      const bin = new Uint8Array(
        fromHexdump(`
          00000000  00 61 73 6d 01 00 00 00  01 81 80 80 80 00 00
          00000010  06 81 80 80 80 00
        `)
      );

      const actual = opt.shrinkPaddedLEB128(bin);

      const expected = fromHexdump(`
        00000000  00 61 73 6d 01 00 00 00  01 01 00
        00000010  06 01 00
      `);

      compareArrayBuffers(actual.buffer, expected);
    });

    it("should shrink first section", () => {
      // Empty module with global and type section
      const bin = new Uint8Array(
        fromHexdump(`
          00000000  00 61 73 6d 01 00 00 00  01 81 80 80 80 00 00
          00000010  06 01 00
        `)
      );

      const actual = opt.shrinkPaddedLEB128(bin);

      const expected = fromHexdump(`
        00000000  00 61 73 6d 01 00 00 00  01 01 00
        00000010  06 01 00
      `);

      compareArrayBuffers(actual.buffer, expected);
    });
  });
});
