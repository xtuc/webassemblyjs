// @flow

const { assert } = require("chai");

const t = require("../../../../lib/compiler/AST");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - administrative instructions", () => {
  it("should stop executing the stackframe at trap", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("trap"),
      t.instruction("nop"),
      t.instruction("nop")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.notEqual(code.length, pc + 1);
    assert.equal(pc, 1);
  });

  it("should stop executing the stackframe at trap in child and propagate up the stack", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),

      t.loopInstruction(undefined, undefined, [t.instruction("trap")]),

      t.instruction("nop"),
      t.instruction("nop")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.notEqual(code.length, pc + 1);
    assert.equal(pc, 1);
  });

  it("should stop executing the stackframe at unreachable", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("unreachable"),
      t.instruction("nop"),
      t.instruction("nop")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.notEqual(code.length, pc + 1);
    assert.equal(pc, 1);
  });

  it("should stop executing the stackframe at unreachable in child and propagate up the stack", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),

      t.loopInstruction(undefined, undefined, [t.instruction("unreachable")]),

      t.instruction("nop"),
      t.instruction("nop")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.notEqual(code.length, pc + 1);
    assert.equal(pc, 1);
  });
});
