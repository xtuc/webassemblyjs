const { decode } = require("@webassemblyjs/wasm-parser");
const { print } = require("@webassemblyjs/wast-printer");

const chai = require("chai");
const glob = require("glob");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const loader = require("../src/index");
const getUsedExports = require("../src/used-exports");

describe("Eliminate unused", () => {
  const testSuites = glob.sync("packages/dce/test/fixtures/**/actual.wast");

  testSuites.forEach(suite => {
    it(suite, () => {
      const wastModule = readFileSync(suite, "utf8");

      const userFile = path.join(path.dirname(suite), "user.tjs");
      const expectedFile = path.join(path.dirname(suite), "expected.wast");

      const usedExports = getUsedExports(readFileSync(userFile, "utf8"));

      const actualBuff = loader(wastModule, usedExports);
      const actualWast = print(decode(actualBuff));

      let expected;
      try {
        expected = readFileSync(expectedFile, "utf8");
      } catch (e) {
        expected = actualWast;

        writeFileSync(expectedFile, actualWast);

        console.log("Write expected file", expectedFile);
      }

      chai.expect(actualWast).to.be.equal(expected);
    });
  });
});
