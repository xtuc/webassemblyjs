// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");

const { i32 } = require("../../../../lib/interpreter/runtime/values/i32");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");
const { compileASTNodes } = require("@webassemblyjs/helper-test-framework");

describe("kernel exec - parametric instructions", () => {
  const operations = [
    {
      name: "drop",

      args: [],

      code: [
        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(2)]),
        t.instruction("drop", [])
      ],

      resEqual: new i32(1)
    }
  ];

  operations.forEach(op => {
    it(op.name + " should result in a correct state", () => {
      const ir = compileASTNodes(op.code);

      const stackFrame = createStackFrame(op.args);
      const res = executeStackFrame(ir, 0, stackFrame);

      if (typeof res === "undefined") {
        throw new Error("No result");
      }

      assert.isTrue(res.value.equals(op.resEqual));
    });
  });

  it("should drop if no values is on the stack", () => {
    const code = [t.instruction("drop", []), t.instruction("end")];

    const ir = compileASTNodes(code);

    const stackFrame = createStackFrame([]);
    const fn = () => executeStackFrame(ir, 0, stackFrame);

    assert.throws(fn, /Assertion error: expected 1 on the stack, found 0/);
  });
});
