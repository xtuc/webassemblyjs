const { assert } = require("chai");
const { execFileSync } = require("child_process");
const parse = require("../../lib/index.js");
const numberOfRuns = process.env.FUZZ_AMOUNT
  ? parseInt(process.env.FUZZ_AMOUNT)
  : 20;

const fuzzerBin = "./packages/floating-point-hex-parser/test/fuzzing/parse.out";
const testCases = [];

for (let i = 1; i < numberOfRuns; ++i) {
  const output = execFileSync(fuzzerBin, [i], {
    encoding: "utf8"
  });

  const [arg, result] = output.split(" ");
  testCases.push({ arg, result });
}

describe('Should behave like "printf" from C', () => {
  testCases.forEach(({ arg, result }) => {
    it(`should parse ${arg}`, () => {
      assert.equal(parse(arg), parseFloat(result));
    });
  });
});
