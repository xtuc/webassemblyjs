// @flow

const glob = require("glob");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const diff = require("jest-diff");
const path = require("path");
const validations = require("../lib");
const { readFileSync } = require("fs");
const { parse } = require("@webassemblyjs/wast-parser");
const { assert } = require("chai");

describe("validation", () => {
  const testSuites = glob.sync(
    "packages/validation/test/fixtures/**/module.wast"
  );

  testSuites.forEach(suite => {
    describe(suite, () => {
      const module = readFileSync(suite, "utf8");
      const expectedErrors = readFileSync(
        path.join(path.dirname(suite), "throws.txt"),
        "utf8"
      )
        .split("\n")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      it("should give correct list of type errors", () => {
        const ast = parse(module);
        const errors = validations.stack(ast);

        const out = diff(expectedErrors.join("\n"), errors.join("\n"));

        if (out !== null && out !== NO_DIFF_MESSAGE) {
          throw new Error("\n" + out);
        }

        assert.deepEqual(errors, expectedErrors);
      });
    });
  });
});
