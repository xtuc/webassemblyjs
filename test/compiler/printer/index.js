// @flow

const glob = require("glob");
const chai = require("chai");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

const { parsers, printers } = require("../../../lib/tools");

describe("printer", () => {
  describe("wast", () => {
    const testSuites = glob.sync(
      "test/compiler/printer/fixtures/wast/**/actual.wast"
    );

    testSuites.forEach(suite => {
      it(suite, () => {
        const input = readFileSync(suite, "utf8");

        parsers.parseWATF(input, ast => {
          const expectedFile = path.join(path.dirname(suite), "expected.wast");
          const code = printers.printWAST(ast);

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
});
