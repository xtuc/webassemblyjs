// @flow

const t = require("@webassemblyjs/ast");
const { assert } = require("chai");

const { isConst } = require("../lib/is-const");

function i32ConstOf(v) {
  return t.objectInstruction("const", "i32", [t.numberLiteral(v)]);
}

describe("validation", () => {
  describe("is const", () => {
    it("should return true for a const expression", () => {
      const exprs = [t.objectInstruction("const", "i32")];

      assert.isTrue(isConst(exprs));
    });

    it("should return false if not constant", () => {
      const exprs = [t.objectInstruction("neg", "i32", [i32ConstOf(1)])];

      assert.isFalse(isConst(exprs));
    });

    it("should return false if empty", () => {
      assert.isFalse(isConst([]));
    });

    it("should return false with multiple non const expressions", () => {
      const exprs = [i32ConstOf(1), t.instruction("nop")];

      assert.isFalse(isConst(exprs));
    });

    it("should return true with multiple const expressions", () => {
      const exprs = [i32ConstOf(1), i32ConstOf(2)];

      assert.isTrue(isConst(exprs));
    });
  });
});
