// @flow

const glob = require("glob");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");

const { parsers } = require("../../../lib/tools");
const wastIdentifierToIndex = require("../../../lib/compiler/AST/transform/wast-identifier-to-index");
const watf = require("../../../lib/compiler/parsing/watf/grammar");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function createCheck(suite, ast) {
  const expectedFile = path.join(path.dirname(suite), "expected.json");
  const code = JSON.stringify(ast, null, 2);

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

  // When one line the error is not caught
  if (code.trim() !== expected.trim()) {
    throw new Error("Assertion error");
  }
}

describe("compiler", () => {
  describe("watf", () => {
    afterEach(() => watf.resetUniqueNameGenerator());

    describe("parsing", () => {
      const testSuites = glob.sync(
        "test/compiler/parsing/fixtures/watf/**/actual.wast"
      );

      testSuites.forEach(suite => {
        it(suite, () => {
          const code = readFileSync(suite, "utf8");
          const ast = parsers.parseWATF(code);

          if (/wast-identifier-to-index/.test(suite) === true) {
            wastIdentifierToIndex.transform(ast);
          }

          createCheck(suite, ast);
        });
      });
    });
  });

  describe("Binary format parsing", () => {
    const testSuites = glob.sync(
      "test/compiler/parsing/fixtures/**/actual.wasm"
    );

    testSuites.forEach(suite => {
      it(suite, () => {
        const bin = toArrayBuffer(readFileSync(suite, null));
        const ast = parsers.parseWASM(bin);
        createCheck(suite, ast);
      });
    });
  });
});
