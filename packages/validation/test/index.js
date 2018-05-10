// @flow

const validations = require("../lib");
const { parse } = require("@webassemblyjs/wast-parser");

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

    compareWithExpected(testSuites, pre, "throws.txt");
  });
});
