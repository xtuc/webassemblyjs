// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");

const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");
const { compileASTNodes } = require("@webassemblyjs/helper-test-framework");

describe("kernel exec - control instruction", () => {
  it("should execute nop", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("nop")
    ];

    const ir = compileASTNodes(code);

    const stackFrame = createStackFrame([]);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(ir, 0, stackFrame);

    assert.equal(code.length, pc + 1);
  });

  describe("loop", () => {
    it("should execute the body of loop in a child stack frame", () => {
      let instructionExecuted = 0;

      const loopCode = [t.instruction("nop"), t.instruction("nop")];

      const loop = [
        t.loopInstruction(t.identifier("loop"), undefined, loopCode)
      ];

      const ir = compileASTNodes(loop);

      const stackFrame = createStackFrame([]);
      stackFrame.trace = () => {
        instructionExecuted++;
      };

      executeStackFrame(ir, 0, stackFrame);

      assert.equal(instructionExecuted, 5);
    });
  });

  describe("block", () => {
    it("should enter and execute an empty block", () => {
      const code = [t.blockInstruction(t.identifier("label"), [])];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      executeStackFrame(ir, 0, stackFrame);
    });

    it("should enter a block and execute instructions", () => {
      let instructionExecuted = 0;

      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.instruction("nop"),
          t.instruction("nop"),
          t.instruction("nop")
        ])
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);

      stackFrame.trace = () => {
        instructionExecuted++;
      };

      executeStackFrame(ir, 0, stackFrame);

      assert.equal(instructionExecuted, 6);
    });

    it("should remove the label when existing the block", () => {
      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(10)])
        ])
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.equal(res.value.toNumber(), 10);
    });
  });

  describe("br_if", () => {
    it("should break if non-zero", () => {
      const code = [
        t.func(t.identifier("label"), t.signature([], []), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(2)])
        ]),

        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
        t.instruction("br_if", [t.identifier("label")])
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.typeOf(res, "object");
      assert.equal(res.value.toNumber(), 2);
    });

    it("should not break if zero", () => {
      const code = [
        t.func(t.identifier("label"), t.signature([], []), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(20)])
        ]),

        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(0)]),
        t.instruction("br_if", [t.identifier("label")]),

        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)])
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.notEqual(res.value.toNumber(), 20);
      assert.equal(res.value.toNumber(), 1);
    });
  });

  describe("if", () => {
    it("should NOT execute consequent when test is zero", () => {
      const code = [
        t.func(t.identifier("test"), t.signature([], []), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(0)])
        ]),

        t.ifInstruction(
          t.identifier("test"),
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(10)])],
          []
        )
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.typeOf(res, "undefined");
    });

    it("should NOT execute consequent but alternate when test is zero", () => {
      const code = [
        t.func(t.identifier("test"), t.signature([], []), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(0)])
        ]),

        t.ifInstruction(
          t.identifier("test"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(10)])]
        )
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.typeOf(res, "undefined");
    });

    it("should execute consequent when test is non-zero", () => {
      const code = [
        t.func(t.identifier("test"), t.signature([], []), [
          t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)])
        ]),

        t.ifInstruction(
          t.identifier("test"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(10)])]
        )
      ];

      const ir = compileASTNodes(code);

      const stackFrame = createStackFrame([]);
      const res = executeStackFrame(ir, 0, stackFrame);

      assert.equal(res.value.toNumber(), 10);
    });
  });
});
