// @flow

const { assert } = require("chai");

const { numberLiteralFromRaw } = require("../lib/node-helpers.js");

const {
  isNumberLiteral,
  isStringLiteral,

  assertNumberLiteral,
  assertStringLiteral,

  table,
  identifier
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

    it("should throw when passing a wrong Node type", () => {
      const fooNode = { type: "Foo" };

      const fn = () => table("bar", fooNode);

      assert.throws(fn, "Argument limits must be of type Limit, given: Foo");
    });

    it("should throw when passing a wrong JS type", () => {
      const fn = () => identifier(true);

      assert.throws(
        fn,
        "Argument value must be of type string, given: boolean"
      );
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
