// @flow
const { assert } = require("chai");

const { isConst } = require("../../lib/compiler/validation/is-const");
const t = require("../../lib/compiler/AST");

describe("validation", () => {
  describe("is const", () => {
    it("should return true for a const expression", () => {
      const exprs = [t.objectInstruction("const", "i32")];

      assert.isTrue(isConst(exprs));
    });

    it("should return false", () => {
      const exprs = [
        t.objectInstruction("neg", "i32", [
          t.objectInstruction("const", "i32", [t.numberLiteral(1)])
        ])
      ];

      assert.isFalse(isConst(exprs));
    });

    it("should return false with multiple expressions", () => {
      const exprs = [t.objectInstruction("const", "i32"), t.instruction("nop")];

      assert.isFalse(isConst(exprs));
    });
  });
});
