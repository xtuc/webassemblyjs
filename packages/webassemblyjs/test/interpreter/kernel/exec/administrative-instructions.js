// @flow

const t = require("@webassemblyjs/ast");
const { assert } = require("chai");

const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - administrative instructions", () => {
  it("should stop executing the stackframe at trap", () => {
    let framepc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("trap"),
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("end")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (framepc = x);

    try {
      executeStackFrame(stackFrame);
      assert.isTrue(false, "execution has not been trapped");
    } catch (e) {
      assert.isOk(e);
    }

    assert.notEqual(code.length, framepc + 1);
    assert.equal(framepc, 2);
  });

  it("should stop executing the stackframe at unreachable", () => {
    let framepc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("unreachable"),
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("end")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (framepc = x);

    try {
      executeStackFrame(stackFrame);
      assert.isTrue(false, "execution has not been trapped");
    } catch (e) {
      assert.isOk(e);
    }

    assert.notEqual(code.length, framepc + 1);
    assert.equal(framepc, 2);
  });
});
