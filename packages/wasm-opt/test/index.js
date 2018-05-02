const {
  compareArrayBuffers
} = require("@webassemblyjs/helper-buffer/lib/compare");

const opt = require("../lib");

// FIXME: move this elsewhere
function hexdumpToBuffer(str) {
  let lines = str.split("\n");

  // remove any leading left whitespace
  lines = lines.map(line => line.trim());

  const bytes = lines.reduce((acc, line) => {
    let cols = line.split(" ");

    // remove the offset, left column
    cols.shift();

    cols = cols.filter(x => x !== "");

    const bytes = cols.map(x => parseInt(x, 16));

    acc.push(...bytes);

    return acc;
  }, []);

  return Buffer.from(bytes);
}

describe("wasm optimizer", () => {
  describe("shrink padded LEB128", () => {
    it("should shrink sections", () => {
      // Empty module with global and type section
      const bin = new Uint8Array(
        hexdumpToBuffer(`
          00000000  00 61 73 6d 01 00 00 00  01 81 80 80 80 00 00
          00000010  06 81 80 80 80 00
        `)
      );

      const actual = opt.shrinkPaddedLEB128(bin);
      console.log("actual", actual);

      const expected = hexdumpToBuffer(`
        00000000  00 61 73 6d 01 00 00 00  01 01 00
        00000010  06 01 00
      `);

      compareArrayBuffers(actual.buffer, expected);
    });

    it("should shrink first section", () => {
      // Empty module with global and type section
      const bin = new Uint8Array(
        hexdumpToBuffer(`
        00000000  00 61 73 6d 01 00 00 00  01 81 80 80 80 00 00
        00000010  06 01 00
      `)
      );

      const actual = opt.shrinkPaddedLEB128(bin);

      const expected = hexdumpToBuffer(`
        00000000  00 61 73 6d 01 00 00 00  01 01 00
        00000010  06 01 00
      `);

      compareArrayBuffers(actual.buffer, expected);
    });
  });
});
