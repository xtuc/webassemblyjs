// @flow

const {
  getFixtures,
  compareWithExpected,
} = require("@webassemblyjs/helper-test-framework");

const denormalizeTypeReferences = require("../lib/transform/denormalize-type-references");
const identifierToIndex = require("../lib/transform/wast-identifier-to-index");

describe("AST transforms", () => {
  describe("denormalize type references", () => {
    const testSuites = getFixtures(
      __dirname,
      "transform/denormalize-type-references/fixtures",
      "**/actual.json"
    );

    const pre = (f) => {
      const ast = JSON.parse(f);
      denormalizeTypeReferences.transform(ast);

      return JSON.stringify(ast, null, 2);
    };

    compareWithExpected(testSuites, pre, "expected.json");
  });

  describe("identifier to numeric literal", () => {
    const testSuites = getFixtures(
      __dirname,
      "transform/wast-identifier-to-index/fixtures",
      "**/actual.json"
    );

    const pre = (f) => {
      const ast = JSON.parse(f);
      identifierToIndex.transform(ast);

      return JSON.stringify(ast, null, 2);
    };

    compareWithExpected(testSuites, pre, "expected.json");
  });
});
