const { parse } = require("@webassemblyjs/wast-parser");
const { print } = require("@webassemblyjs/wast-printer");
const path = require("path");

const {
  getFixtures,
  compareStrings
} = require("@webassemblyjs/helper-test-framework");
const { readFileSync } = require("fs");

const { transformAst } = require("../lib/");

const testCases = getFixtures(
  path.join(__dirname, "./wast/"),
  "/**/input.wast"
);

testCases.forEach(testCase => {
  describe(testCase, () => {
    const input = readFileSync(testCase, "utf8").trim();
    const expectedOutput = readFileSync(
      path.join(path.dirname(testCase), "output.wast"),
      "utf8"
    ).trim();

    it("should transpile sign extension operators into functions correctly", () => {
      const actualOutput = print(transformAst(parse(input)));
      compareStrings(actualOutput, expectedOutput);
    });
  });
});
