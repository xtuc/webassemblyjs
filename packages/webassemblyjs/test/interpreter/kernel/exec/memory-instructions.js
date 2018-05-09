// @flow

const t = require("@webassemblyjs/ast");

const Long = require("long");
const { assert } = require("chai");

const { i32 } = require("../../../../lib/interpreter/runtime/values/i32");
const { i64 } = require("../../../../lib/interpreter/runtime/values/i64");
const { f32 } = require("../../../../lib/interpreter/runtime/values/f32");
const { f64 } = require("../../../../lib/interpreter/runtime/values/f64");

const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - memory instructions", () => {
  const operations = [
    {
      name: "i64.const",

      args: [],

      code: [
        t.objectInstruction("const", "i64", [t.numberLiteral("10", "i64")])
      ],

      resEqual: new i64(new Long.fromString("10"))
    },

    {
      name: "i32.const",

      args: [],

      code: [t.objectInstruction("const", "i32", [t.numberLiteral(10)])],

      resEqual: new i32(new Long.fromString("10"))
    },

    {
      name: "f32.const",

      args: [],

      code: [t.objectInstruction("const", "f32", [t.numberLiteral(10.0)])],

      resEqual: new f32(10.0)
    },

    {
      name: "f64.const",

      args: [],

      code: [t.objectInstruction("const", "f64", [t.numberLiteral(10.0)])],

      resEqual: new f64(10.0)
    },

    {
      name: "set_local",

      args: [],

      code: [
        t.instruction("set_local", [
          t.numberLiteral(0),
          t.objectInstruction("const", "i32", [t.numberLiteral(10)])
        ]),
        t.instruction("get_local", [t.numberLiteral(0)])
      ],

      resEqual: new i32(10)
    },

    {
      name: "tee_local",

      args: [],

      code: [
        t.instruction("tee_local", [
          t.numberLiteral(0),
          t.objectInstruction("const", "i32", [t.numberLiteral(2)])
        ])
      ],

      resEqual: new i32(2)
    }
  ];

  operations.forEach(op => {
    it(op.name + " should result in a correct state", () => {
      op.code.push(t.instruction("end"));

      const stackFrame = createStackFrame(op.code, op.args);
      const res = executeStackFrame(stackFrame);

      if (typeof res === "undefined") {
        throw new Error("No result");
      }

      assert.isTrue(
        res.value.equals(op.resEqual),
        res.value + " != " + op.resEqual
      );
    });
  });
});
