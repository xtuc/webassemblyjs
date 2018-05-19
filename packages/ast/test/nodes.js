// @flow

const { assert } = require("chai");

const { numberLiteralFromRaw } = require("../lib/node-helpers.js");

const {
  isNumberLiteral,
  isStringLiteral,

  assertNumberLiteral,
  assertStringLiteral
} = require("../lib/nodes.js");

describe("Node utils", () => {
  const n = numberLiteralFromRaw(1, "1");

  describe("builder", () => {
    it("should have the correct properties", () => {
      assert.equal(n.type, "NumberLiteral");

      assert.typeOf(n.value, "number");
      assert.equal(n.value, 1);

      assert.typeOf(n.raw, "string");
      assert.equal(n.raw, "1");
    });
  });

  describe("assertion", () => {
    it("should throw when type does not match", () => {
      const fn = () => assertStringLiteral(n);
      assert.throws(fn);
    });

    it("should do nothing when type matchs", () => {
      const fn = () => assertNumberLiteral(n);
      fn();
    });
  });

  describe("test", () => {
    it("should return false when type does not match", () => {
      assert.isFalse(isStringLiteral(n));
    });

    it("should return true when type matchs", () => {
      assert.isTrue(isNumberLiteral(n));
    });
  });
});
