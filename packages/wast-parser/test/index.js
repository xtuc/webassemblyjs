// @flow

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

const { parse } = require("../lib");
const { tokenize } = require("../lib/tokenizer");

describe("compiler", () => {
  describe("wast", () => {
    describe("tokenizing", () => {
      const testSuites = getFixtures(__dirname, "tokenizer", "**/actual.wast");
      const pre = f => JSON.stringify(tokenize(f), null, 2);

      compareWithExpected(testSuites, pre, "expected.json");
    });

    describe("parsing", () => {
      const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wast");

      const pre = f => {
        const ast = parse(f);

        return JSON.stringify(ast, null, 2);
      };

      compareWithExpected(testSuites, pre, "expected.json");
    });
  });
});
