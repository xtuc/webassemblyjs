// @flow

const wastIdentifierToIndex = require("@webassemblyjs/ast/lib/transform/wast-identifier-to-index");

const glob = require("glob");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync, existsSync } = require("fs");
const path = require("path");

const { parse } = require("../lib");
const { tokenize } = require("../lib/tokenizer");

function createCheck(suite, ast) {
  const expectedFile = path.join(path.dirname(suite), "expected.json");
  const code = JSON.stringify(ast, null, 2);

  let expected;
  try {
    expected = readFileSync(expectedFile, "utf8");
    expected = JSON.stringify(JSON.parse(expected), null, 2);
  } catch (e) {
    expected = code;

    writeFileSync(expectedFile, code);

    console.log("Write expected file", expectedFile);
  }

  const out = diff(code.trim(), expected.trim());

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }

  // When one line the error is not caught
  if (code.trim() !== expected.trim()) {
    throw new Error("Assertion error");
  }
}

describe("compiler", () => {
  describe("wast", () => {
    describe("tokenizing", () => {
      const testSuites = glob.sync(
        "packages/wast-parser/test/tokenizer/**/actual.wast"
      );

      testSuites.forEach(suite => {
        it(suite, () => {
          const code = readFileSync(suite, "utf8");
          const throwsFile = path.join(path.dirname(suite), "throws.txt");
          let tokens;
          let actualError = false;
          let expectedError = false;

          if (existsSync(throwsFile)) {
            expectedError = readFileSync(throwsFile, "utf8").trim();
          }

          try {
            tokens = tokenize(code);
          } catch (e) {
            actualError = e;
          }

          if (actualError === false && expectedError === false) {
            createCheck(suite, tokens);
          }

          if (actualError !== false && expectedError === false) {
            throw actualError;
          }

          if (actualError === false && expectedError !== false) {
            throw new Error(
              `Expected parser error "${expectedError}", but got none.`
            );
          }

          if (
            actualError !== false &&
            expectedError !== false &&
            actualError.message !== expectedError
          ) {
            throw new Error(
              `Expected parser error "${expectedError}", but got "${
                actualError.message
              }".`
            );
          }
        });
      });
    });

    describe("parsing", () => {
      const testSuites = glob.sync(
        "packages/wast-parser/test/fixtures/**/actual.wast"
      );

      testSuites.forEach(suite => {
        it(suite, () => {
          const code = readFileSync(suite, "utf8");
          const throwsFile = path.join(path.dirname(suite), "throws.txt");
          let ast;
          let actualError = false;
          let expectedError = false;

          if (existsSync(throwsFile)) {
            expectedError = readFileSync(throwsFile, "utf8").trim();
          }

          try {
            ast = parse(code);
          } catch (e) {
            actualError = e;
          }

          if (actualError === false && expectedError === false) {
            if (/wast-identifier-to-index/.test(suite) === true) {
              wastIdentifierToIndex.transform(ast);
            }
            createCheck(suite, ast);
          }

          if (actualError !== false && expectedError === false) {
            throw actualError;
          }

          if (actualError === false && expectedError !== false) {
            throw new Error(
              `Expected parser error "${expectedError}", but got none.`
            );
          }

          if (
            actualError !== false &&
            expectedError !== false &&
            actualError.message !== expectedError
          ) {
            throw new Error(
              `Expected parser error "${expectedError}", but got "${
                actualError.message
              }".`
            );
          }
        });
      });
    });
  });
});
