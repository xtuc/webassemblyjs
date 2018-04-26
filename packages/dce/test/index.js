// @flow

const {
  getFixtures,
  compareWithExpected
} = require("@webassemblyjs/helper-test-framework");

const { decode } = require("@webassemblyjs/wasm-parser");
const { print } = require("@webassemblyjs/wast-printer");

const { readFileSync } = require("fs");
const { dirname, join } = require("path");

const loader = require("../src/index");
const getUsedExports = require("../src/used-exports");

describe("Eliminate unused", () => {
  const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wast");

  const pre = (f, suite) => {
    const userFile = join(dirname(suite), "user.tjs");

    const usedExports = getUsedExports(readFileSync(userFile, "utf8"));

    const actualBuff = loader(f, usedExports);

    return print(decode(actualBuff));
  };

  compareWithExpected(testSuites, pre, "expected.wast");
});
