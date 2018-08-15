// @flow

const validations = require("../lib");
const { parse } = require("@webassemblyjs/wast-parser");
const { decode } = require("@webassemblyjs/wasm-parser");
const wabt = require("wabt");

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

function errorsToString(arr) {
  return arr
    .map(x => x.trim())
    .filter(s => s.length > 0)
    .join("\n");
}

describe("validation", () => {
  const testSuites = getFixtures(__dirname, "fixtures", "**/module.wast");

  describe("wast", () => {
    const pre = f => {
      const errors = validations.stack(parse(f));

      return errorsToString(errors);
    };

    compareWithExpected(testSuites, pre, "output.txt");
  });

  describe("wasm", () => {
    const pre = (f, suite) => {
      const module = wabt.parseWat(suite, f);
      const { buffer } = module.toBinary({ write_debug_names: false });

      const errors = validations.stack(decode(buffer));

      return errorsToString(errors);
    };

    compareWithExpected(testSuites, pre, "output-wasm.txt");
  });
});
