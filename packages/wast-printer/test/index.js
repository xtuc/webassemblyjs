// @flow

const { parse } = require("@webassemblyjs/wast-parser");
const glob = require("glob");
const chai = require("chai");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

const { print } = require("../lib/index");

describe("printer", () => {
  describe("wast", () => {
    const testSuites = glob.sync(
      "packages/wast-printer/test/fixtures/**/actual.wast"
    );

    testSuites.forEach(suite => {
      it(suite, () => {
        const input = readFileSync(suite, "utf8");

        const ast = parse(input);

        const expectedFile = path.join(path.dirname(suite), "expected.wast");
        const code = print(ast);

        let expected;
        try {
          expected = readFileSync(expectedFile, "utf8");
        } catch (e) {
          expected = code;

          writeFileSync(expectedFile, code);

          console.log("Write expected file", expectedFile);
        }

        const out = diff(code.trim(), expected.trim());

        if (out !== null && out !== NO_DIFF_MESSAGE) {
          throw new Error("\n" + out);
        }

        chai.expect(code).to.be.equal(expected);
      });
    });
  });
});
