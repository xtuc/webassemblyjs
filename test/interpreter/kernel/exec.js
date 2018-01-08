// @flow

const { assert } = require("chai");

const t = require("../../../lib/compiler/AST");
const { executeStackFrame } = require("../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../lib/interpreter/kernel/stackframe");

describe("kernel exec", () => {
  describe("stackframe tracing", () => {
    it("should be called after each instruction", () => {
      let calls = 0;

      const code = [t.instruction("nop"), t.instruction("nop")];

      const stackFrame = createStackFrame(code, []);
      stackFrame.trace = () => calls++;

      executeStackFrame(stackFrame);

      assert.equal(calls, code.length);
    });
  });

  describe("pc", () => {
    it("should increase after each instruction", () => {
      let pc = 0;

      const code = [t.instruction("nop"), t.instruction("nop")];

      const stackFrame = createStackFrame(code, []);
      stackFrame.trace = (_, x) => (pc = x);

      executeStackFrame(stackFrame);

      assert.equal(pc, code.length - 1);
    });
  });
});
