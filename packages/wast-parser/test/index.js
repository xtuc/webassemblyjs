// @flow

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

const wastIdentifierToIndex = require("@webassemblyjs/ast/lib/transform/wast-identifier-to-index");

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

      const pre = (f, suite) => {
        const ast = parse(f);
        if (/wast-identifier-to-index/.test(suite) === true) {
          wastIdentifierToIndex.transform(ast);
        }

        return JSON.stringify(ast, null, 2);
      };

      compareWithExpected(testSuites, pre, "expected.json");
    });
  });
});
