// @flow

const { assert } = require("chai");
const { parseString } = require("../lib/string-literals");

describe("string literal parsing", () => {
  it("should support empty strings", () => {
    assert.deepEqual(parseString(""), []);
  });

  it("should support ASCII encoding", () => {
    assert.deepEqual(parseString("abc"), [97, 98, 99]);
  });

  it("should throw if the string contains control characters", () => {
    const stringWithControlChar = "abc" + String.fromCharCode(8); // backspace
    assert.throws(
      () => parseString(stringWithControlChar),
      "ASCII control characters are not permitted within string literals"
    );
  });

  it("should throw if the string contains a quotation mark", () => {
    assert.throws(
      () => parseString('ab"c'),
      "quotes are not permitted within string literals"
    );
  });

  it("should support escaped encoding", () => {
    assert.deepEqual(parseString("ab\\22c"), [97, 98, 34, 99]);
    assert.deepEqual(parseString("ab\\aac"), [97, 98, 170, 99]);
    assert.deepEqual(parseString("ab\\AAc"), [97, 98, 170, 99]);
    assert.deepEqual(parseString("\\01bc"), [1, 98, 99]);
  });

  it("should support escaped control characters", () => {
    assert.deepEqual(parseString("ab\\tc"), [97, 98, 9, 99]);
    assert.deepEqual(parseString('\\t\\n\\r\\"\\′\\\\'), [
      0x09,
      0x0a,
      0x0d,
      0x22,
      0x27,
      0x5c
    ]);
  });

  it("should throw if encoded character is invalid", () => {
    assert.throws(() => parseString("abc\\2k"), "invalid character encoding");
  });
});
