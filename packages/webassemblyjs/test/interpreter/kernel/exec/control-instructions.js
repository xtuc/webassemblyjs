// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");

const {
  executeStackFrame,
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame,
} = require("../../../../lib/interpreter/kernel/stackframe");
const { compileASTNodes } = require("@webassemblyjs/helper-test-framework");

describe("kernel exec - control instruction", () => {
  it("should execute nop", () => {
    let pc = 0;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("nop"),
    ];

    const ir = compileASTNodes(code);

    const stackFrame = createStackFrame([]);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(ir, 0, stackFrame);

    assert.equal(code.length, pc + 1);
  });
});
