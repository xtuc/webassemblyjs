// @flow

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

const { print } = require("../lib/index");

describe("printer", () => {
  describe("wast", () => {
    const testSuites = getFixtures(__dirname, "fixtures", "**/actual.json");
    const pre = f => print(JSON.parse(f));

    compareWithExpected(testSuites, pre, "expected.wast");
  });
});
