// @flow

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");
const { parse } = require("@webassemblyjs/wast-parser");

const { print } = require("../lib/index");

describe("printer", () => {
  describe("wast", () => {
    const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wast");
    const pre = f => print(parse(f));

    compareWithExpected(testSuites, pre, "expected.wast");
  });
});
