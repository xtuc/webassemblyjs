// @flow

const { assert } = require("chai");

const t = require("../../../../lib/compiler/AST");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - control instruction", () => {
  it("should execute nop", () => {
    let pc;

    const code = [
      t.instruction("nop"),
      t.instruction("nop"),
      t.instruction("nop")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.equal(code.length, pc + 1);
  });

  describe("loop", () => {
    it("should execute the body of loop in a child stack frame", () => {
      let maxDepth = 0;

      const loopCode = [t.instruction("nop"), t.instruction("nop")];

      const loop = [t.loopInstruction(undefined, undefined, loopCode)];

      const stackFrame = createStackFrame(loop, []);
      stackFrame.trace = (depth, pc) => {
        if (depth === 0) {
          assert.equal(pc, 0);
        }

        if (depth === 1) {
          assert.isAtLeast(pc, 0);
          assert.isBelow(pc, 2);
        }

        if (maxDepth < depth) {
          maxDepth = depth;
        }
      };

      executeStackFrame(stackFrame);

      assert.equal(maxDepth, 1);
    });
  });

  describe("block", () => {
    it("should enter and execute an empty block", () => {
      const code = [t.blockInstruction(t.identifier("label"), [])];

      const stackFrame = createStackFrame(code, []);
      executeStackFrame(stackFrame);
    });

    it("should enter a block and execute instructions", () => {
      let maxDepth = 0;
      let instructionExecuted = 0;

      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.instruction("nop"),
          t.instruction("nop"),
          t.instruction("nop")
        ])
      ];

      const stackFrame = createStackFrame(code, []);

      stackFrame.trace = (depth, pc) => {
        instructionExecuted++;

        if (depth === 0) {
          assert.equal(pc, 0);
        }

        if (maxDepth < depth) {
          maxDepth = depth;
        }
      };

      executeStackFrame(stackFrame);

      assert.equal(maxDepth, 1);
      assert.equal(instructionExecuted, 4);
    });

    it("should remove the label when existing the block", () => {
      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.objectInstruction("const", "i32", [t.numberLiteral(10)])
        ])
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value.toNumber(), 10);
    });
  });

  describe("br_if", () => {
    it("should break if non-zero", () => {
      const code = [
        t.func(
          t.identifier("label"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteral(2)])]
        ),

        t.objectInstruction("const", "i32", [t.numberLiteral(1)]),
        t.instruction("br_if", [t.identifier("label")])
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.typeOf(res, "object");
      assert.equal(res.value.toNumber(), 2);
    });

    it("should not break if zero", () => {
      const code = [
        t.func(
          t.identifier("label"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteral(20)])]
        ),

        t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
        t.instruction("br_if", [t.identifier("label")]),

        t.objectInstruction("const", "i32", [t.numberLiteral(1)])
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.notEqual(res.value.toNumber(), 20);
      assert.equal(res.value.toNumber(), 1);
    });
  });

  describe("if", () => {
    it("should NOT execute consequent when test is zero", () => {
      const code = [
        t.func(
          t.identifier("test"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteral(0)])]
        ),

        t.ifInstruction(
          t.identifier("test"),
          [][t.objectInstruction("const", "i32", [t.numberLiteral(10)])],
          []
        )
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.typeOf(res, "undefined");
    });

    it("should NOT execute consequent but alternate when test is zero", () => {
      const code = [
        t.func(
          t.identifier("test"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteral(0)])]
        ),

        t.ifInstruction(t.identifier("test"), [], null, [
          t.objectInstruction("const", "i32", [t.numberLiteral(10)])
        ])
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.typeOf(res, "undefined");
    });

    it("should execute consequent when test is non-zero", () => {
      const code = [
        t.func(
          t.identifier("test"),
          [],
          [],
          [t.objectInstruction("const", "i32", [t.numberLiteral(1)])]
        ),

        t.ifInstruction(t.identifier("test"), [], null, [
          t.objectInstruction("const", "i32", [t.numberLiteral(10)])
        ])
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value.toNumber(), 10);
    });
  });
});
