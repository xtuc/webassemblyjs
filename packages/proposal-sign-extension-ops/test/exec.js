const path = require("path");
const wabt = require("wabt");
const assert = require("assert");

const { readFileSync } = require("fs");

const polyfills = [
  {
    name: "i32_extend8_s",
    fixtures: [
      [0, 0],
      [0x7f, 127],
      [0x80, -128],
      [0xff, -1],
      [0x01234500, 0],
      [0xfedcba80, -0x80],
      [-1, -1]
    ]
  },
  {
    name: "i32_extend16_s",
    fixtures: [
      [0, 0],
      [0x7fff, 32767],
      [0x8000, -32768],
      [0xffff, -1],
      [0x01230000, 0],
      [0xfedc8000, -0x8000],
      [-1, -1]
    ]
  }
];

polyfills.forEach(p => {
  p.path = path.join(__dirname, `../lib/polyfills/${p.name}.wast`);
});

polyfills.forEach(polyfill => {
  describe(polyfill.path, () => {
    const wast = readFileSync(polyfill.path, "utf8").trim();
    const wasm = wabt
      .parseWat(polyfill.path, wast)
      .toBinary({ write_debug_names: false });

    it("should return correct values", () => {
      return WebAssembly.instantiate(wasm.buffer).then(result => {
        const polyfillFn = result.instance.exports[polyfill.name];
        polyfill.fixtures.forEach(([input, output]) => {
          assert.equal(output, polyfillFn(input));
        });
      });
    });
  });
});
