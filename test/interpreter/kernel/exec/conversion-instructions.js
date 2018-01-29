// @flow
const Long = require("long");
const { assert } = require("chai");

const { i32 } = require("../../../../lib/interpreter/runtime/values/i32");
const { i64 } = require("../../../../lib/interpreter/runtime/values/i64");
const {
  castIntoStackLocalOfType
} = require("../../../../lib/interpreter/runtime/castIntoStackLocalOfType");
const t = require("../../../../lib/compiler/AST");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - conversion instructions", () => {
  const operations = [
    {
      name: "i32.reinterpret/f32 - typical case",

      args: [{ value: 3.1415926, type: "f32" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(1078530010)
    },

    {
      name: "i32.reinterpret/f32 - boundary value",

      args: [{ value: 0.0, type: "f32" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0)
    },

    {
      name: "i32.reinterpret/f32 - boundary value",

      args: [{ value: -0.0, type: "f32" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0x80000000)
    },

    {
      name: "i32.reinterpret/f32 - nan value",

      args: [{ value: 0x400000, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0x7fc00000)
    },

    {
      name: "i64.reinterpret/f64 - boundary value",

      args: [{ value: 0.0, type: "f64" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0"))
    },

    {
      name: "i64.reinterpret/f64 - typical case",

      args: [{ value: 3.14159265358979, type: "f64" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("4614256656552045841"))
    },

    {
      name: "i64.reinterpret/f64 - boundary value",

      args: [{ value: 0.0, type: "f64" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0"))
    },

    {
      name: "i64.reinterpret/f64 - boundary value",

      args: [{ value: -0.0, type: "f64" }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("8000000000000000", false, 16))
    }
  ];

  operations.forEach(op => {
    describe(op.name, () => {
      it("should get the correct result", () => {
        const args = op.args.map(({ value, type, nan }) =>
          castIntoStackLocalOfType(type, value, nan)
        );

        const stackFrame = createStackFrame(op.code, args);
        const res = executeStackFrame(stackFrame);

        assert.isTrue(
          res.value.equals(op.resEqual),
          `expected ${res.value.toString()} to equal ${op.resEqual.toString()}`
        );
      });
    });
  });
});
