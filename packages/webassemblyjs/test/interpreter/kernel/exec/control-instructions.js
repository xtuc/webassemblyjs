// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");

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
      t.instruction("nop"),
      t.instruction("end")
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.equal(code.length, pc + 1);
  });

  describe("loop", () => {
    it("should execute the body of loop in a child stack frame", () => {
      let instructionExecuted = 0;

      const loopCode = [
        t.instruction("nop"),
        t.instruction("nop"),
        t.instruction("end")
      ];

      const loop = [
        t.loopInstruction(t.identifier("loop"), undefined, loopCode),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(loop, []);
      stackFrame.trace = () => {
        instructionExecuted++;
      };

      executeStackFrame(stackFrame);

      assert.equal(instructionExecuted, 5);
    });
  });

  describe("block", () => {
    it("should enter and execute an empty block", () => {
      const code = [
        t.blockInstruction(t.identifier("label"), []),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(code, []);
      executeStackFrame(stackFrame);
    });

    it("should enter a block and execute instructions", () => {
      let instructionExecuted = 0;

      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.instruction("nop"),
          t.instruction("nop"),
          t.instruction("nop"),
          t.instruction("end")
        ]),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(code, []);

      stackFrame.trace = () => {
        instructionExecuted++;
      };

      executeStackFrame(stackFrame);

      assert.equal(instructionExecuted, 6);
    });

    it("should remove the label when existing the block", () => {
      const code = [
        t.blockInstruction(t.identifier("label"), [
          t.objectInstruction("const", "i32", [t.numberLiteral(10)]),
          t.instruction("end")
        ]),
        t.instruction("end")
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
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(2)]),
            t.instruction("end")
          ]
        ),

        t.objectInstruction("const", "i32", [t.numberLiteral(1)]),
        t.instruction("br_if", [t.identifier("label")]),
        t.instruction("end")
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
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(20)]),
            t.instruction("end")
          ]
        ),

        t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
        t.instruction("br_if", [t.identifier("label")]),

        t.objectInstruction("const", "i32", [t.numberLiteral(1)]),
        t.instruction("end")
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.notEqual(res.value.toNumber(), 20);
      assert.equal(res.value.toNumber(), 1);
    });
  });

  describe.skip("if", () => {
    it("should NOT execute consequent when test is zero", () => {
      const code = [
        t.func(
          t.identifier("test"),
          [t.instruction("end")],
          [t.instruction("end")],
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
            t.instruction("end")
          ]
        ),

        t.ifInstruction(
          t.identifier("test"),
          [t.instruction("end")],
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(10)]),
            t.instruction("end")
          ],
          [t.instruction("end")]
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
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
            t.instruction("end")
          ]
        ),

        t.ifInstruction(
          t.identifier("test"),
          [t.instruction("end")],
          [t.instruction("end")],
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(10)]),
            t.instruction("end")
          ]
        )
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
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(1)]),
            t.instruction("end")
          ]
        ),

        t.ifInstruction(
          t.identifier("test"),
          [t.instruction("end")],
          [t.instruction("end")],
          [
            t.objectInstruction("const", "i32", [t.numberLiteral(10)]),
            t.instruction("end")
          ]
        )
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value.toNumber(), 10);
    });
  });
});
