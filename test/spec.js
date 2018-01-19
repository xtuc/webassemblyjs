// @flow

const { readFileSync } = require("fs");
const glob = require("glob");

const WebAssembly = require("../lib");

const TEST_WHITELIST = ["spec/test/core/exports.wast"];

describe("spec", () => {
  describe("watf", () => {
    const testSuites = glob
      .sync("spec/test/core/**/*.wast")
      .filter(suite => TEST_WHITELIST.indexOf(suite) !== -1);

    testSuites.forEach(suite => {
      describe(suite, () => {
        const module = readFileSync(suite, "utf8");

        it("should run the test file", () => {
          WebAssembly.instantiateFromSpecTest(module);
        });
      });
    });
  });
});
