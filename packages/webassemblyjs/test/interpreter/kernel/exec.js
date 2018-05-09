// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");

const { executeStackFrame } = require("../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../lib/interpreter/kernel/stackframe");

describe("kernel exec", () => {
  describe("stackframe tracing", () => {
    it("should be called after each instruction", () => {
      let calls = 0;

      const code = [
        t.instruction("nop"),
        t.instruction("nop"),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(code, []);
      stackFrame.trace = () => calls++;

      executeStackFrame(stackFrame);

      assert.equal(calls, code.length);
    });
  });

  describe("blockpc", () => {
    it("should increase after each instruction", () => {
      let blockpc = 0;

      const code = [
        t.instruction("nop"),
        t.instruction("nop"),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(code, []);
      stackFrame.trace = (_, x) => (blockpc = x);

      executeStackFrame(stackFrame);

      assert.equal(blockpc, code.length - 1);
    });
  });
});
