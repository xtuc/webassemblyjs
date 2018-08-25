const { parse } = require("@webassemblyjs/wast-parser");
const { print } = require("@webassemblyjs/wast-printer");
const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

const { flatten } = require("../lib");

describe("AST flatten", () => {
  const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wast");
  const pre = f => print(flatten(parse(f)));

  compareWithExpected(testSuites, pre, "expected.wast");
});
