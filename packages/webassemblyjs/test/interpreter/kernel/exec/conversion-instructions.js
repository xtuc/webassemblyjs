// @flow

const t = require("@webassemblyjs/ast");

const Long = require("long");
const { assert } = require("chai");

const { i32 } = require("../../../../lib/interpreter/runtime/values/i32");
const { i64 } = require("../../../../lib/interpreter/runtime/values/i64");
const {
  castIntoStackLocalOfType
} = require("../../../../lib/interpreter/runtime/castIntoStackLocalOfType");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

/*::
type TestCase = {
  name: string,

  args: Array<{
    value: any,
    type: string,
    nan?: boolean,
    inf?: boolean
  }>,

  code: Array<Node>,
  resEqual: any
};
*/

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
      name: "i32.reinterpret/f32 - canonical nan",

      args: [{ value: 0x400000, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0x7fc00000)
    },
    {
      name: "i32.reinterpret/f32 - negative canonical nan",

      args: [{ value: -0x400000, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0xffc00000)
    },

    {
      name: "i32.reinterpret/f32 - negative nan payload",

      args: [{ value: -0x7fffff, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(-1)
    },
    {
      name: "i32.reinterpret/f32 - negative nan payload",

      args: [{ value: 0x200000, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0x7fa00000)
    },
    {
      name: "i32.reinterpret/f32 - negative nan payload",

      args: [{ value: -0x200000, type: "f32", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0xffa00000)
    },

    {
      name: "i32.reinterpret/f32 - positive infinity",

      args: [{ value: 1, type: "f32", inf: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0x7f800000)
    },
    {
      name: "i32.reinterpret/f32 - negative infinity",

      args: [{ value: -1, type: "f32", inf: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f32", "i32")
      ],

      resEqual: new i32(0xff800000)
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
    },
    {
      name: "i64.reinterpret/f64 - positive infinity",

      args: [{ value: 1, type: "f64", inf: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0x7ff0000000000000", false, 16))
    },
    {
      name: "i64.reinterpret/f64 - negative infinity",

      args: [{ value: -1, type: "f64", inf: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0xfff0000000000000", false, 16))
    },
    {
      name: "i64.reinterpret/f64 - negative nan payload",

      args: [{ value: -0xfffffffffffff, type: "f64", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.NEG_ONE)
    },
    {
      name: "i64.reinterpret/f64 - canonical nan",

      args: [{ value: 0x4000000000000, type: "f64", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0x7ff4000000000000", false, 16))
    },
    {
      name: "i64.reinterpret/f64 - negative canonical nan",

      args: [{ value: -0x4000000000000, type: "f64", nan: true }],

      code: [
        t.instruction("get_local", [t.numberLiteral(0)]),
        t.objectInstruction("reinterpret/f64", "i64")
      ],

      resEqual: new i64(Long.fromString("0xfff4000000000000", false, 16))
    }
  ];

  operations.forEach((op /*: TestCase */) => {
    describe(op.name, () => {
      it("should get the correct result", () => {
        const args = op.args.map(({ value, type, nan, inf }) =>
          castIntoStackLocalOfType(type, value, nan, inf)
        );

        op.code.push(t.instruction("end"));

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
