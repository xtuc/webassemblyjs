// @flow

const glob = require("glob");
const { writeFileSync, existsSync, readFileSync } = require("fs");
const { join, dirname } = require("path");
const { assert } = require("chai");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");

const THROWS_TXT = "throws.txt";
const NOOP_PRE = () => "";

export function getFixtures(
  dirname: string,
  ...rest: Array<string>
): Array<string> {
  const dir = join(dirname, ...rest);
  const fixtures = glob.sync(dir);

  if (fixtures.length === 0) {
    throw new Error("No fixtures found in " + JSON.stringify(dir));
  }

  return fixtures;
}

function getThrowsFile(dirname: string) {
  const throwsFile = join(dirname, THROWS_TXT);

  if (existsSync(throwsFile)) {
    return readFileSync(throwsFile, "utf8").trim();
  }
}

function compareStrings(actual: string, expected: string) {
  actual = actual.trim();
  expected = expected.trim();

  const out = diff(actual, expected);

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }

  assert.equal(actual, expected);
}

export function compareWithExpected(
  fixtures: Array<string>,
  pre: (string, string) => string = NOOP_PRE,
  expectedFilename: string = "expected.wast"
) {
  fixtures.forEach(suite => {
    it(suite, () => {
      const input = readFileSync(suite, "utf8");
      const expectedThrows = getThrowsFile(dirname(suite));

      let actual = "";

      try {
        actual = pre(input, suite);

        if (typeof expectedThrows !== "undefined") {
          throw new Error(
            `Expected parser error "${expectedThrows}", but got none.`
          );
        }
      } catch (e) {
        if (expectedThrows === undefined) {
          throw e;
        }

        compareStrings(e.message, expectedThrows);
        return;
      }

      const expectedFile = join(dirname(suite), expectedFilename);

      let expected;

      try {
        expected = readFileSync(expectedFile, "utf8");
      } catch (e) {
        expected = actual;

        writeExpectedFile(expectedFile, actual);
      }

      compareStrings(actual, expected);
    });
  });
}

function writeExpectedFile(expectedFile, content) {
  writeFileSync(expectedFile, content);
  console.log("Write expected file", expectedFile);
}
