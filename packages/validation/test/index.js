// @flow

const glob = require("glob");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const diff = require("jest-diff");
const path = require("path");
const validations = require("../lib");
const { readFileSync } = require("fs");
const { parse } = require("@webassemblyjs/wast-parser");
const { assert } = require("chai");

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
