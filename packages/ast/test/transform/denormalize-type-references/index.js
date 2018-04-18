// @flow
const {
  transform
} = require("../../../lib/transform/denormalize-type-references");
const { readFileSync } = require("fs");
const path = require("path");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");

const compareMultilineString = (a, b) => {
  a = JSON.stringify(a, null, 2);
  b = JSON.stringify(b, null, 2);
  const out = diff(a.trim(), b.trim());
  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }
  if (a.trim() !== b.trim()) {
    throw new Error("Assertion error");
  }
};

const loadJSON = filename =>
  JSON.parse(readFileSync(path.join(__dirname, filename), "utf8"));

const copy = json => JSON.parse(JSON.stringify(json));

describe("denormalize type references", () => {
  it("supports index-based references", () => {
    const input = loadJSON("reference-by-index.json");
    const transformed = copy(input);
    transform(transformed);
    const expected = loadJSON("reference-by-index-expected.json");
    compareMultilineString(expected, transformed);
  });

  it("supports named references", () => {
    const input = loadJSON("reference-by-name.json");
    const transformed = copy(input);
    transform(transformed);
    const expected = loadJSON("reference-by-name-expected.json");
    compareMultilineString(expected, transformed);
  });

  it("supports call indirect", () => {
    const input = loadJSON("reference-call-indirect.json");
    const transformed = copy(input);
    transform(transformed);
    const expected = loadJSON("reference-call-indirect-expected.json");
    compareMultilineString(expected, transformed);
  });
});
