const { assert } = require("chai");
const t = require("@webassemblyjs/ast");

const { encodeNode } = require("../lib");
const encoder = require("../lib/encoder");

function callIndirectInstructionIndex(index) {
  return {
    type: "CallIndirectInstruction",
    index,
  };
}

const fixtures = [
  {
    name: "ModuleImport - should generate a i32 global",
    node: t.moduleImport("a", "b", t.globalType("i32", "const")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7f, 0x00],
  },

  {
    name: "ModuleImport - should generate a i64 global",
    node: t.moduleImport("a", "b", t.globalType("i64", "const")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7e, 0x00],
  },

  {
    name: "ModuleImport - should generate a mutable i32 global",
    node: t.moduleImport("a", "b", t.globalType("i32", "var")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7f, 0x01],
  },

  {
    name: "ModuleImport - should generate a mutable i64 global",
    node: t.moduleImport("a", "b", t.globalType("i64", "var")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7e, 0x01],
  },

  {
    name: "a memory ModuleImport",
    node: t.moduleImport("a", "b", t.memory(t.limit(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x02, 0x00, 0x02],
  },

  {
    name: '(import "a" "b" (func (result i32))',
    node: t.moduleImport(
      "a",
      "b",
      t.funcImportDescr(t.numberLiteralFromRaw(0), t.signature([], ["i32"]))
    ),
    expected: [0x01, 0x61, 0x01, 0x62, 0x00, 0x00],
  },

  {
    name: "(type (func))",
    node: t.typeInstruction(undefined, t.signature([], [])),
    expected: [0x60, 0x00, 0x00],
  },

  {
    name: "(type (func (result i32)))",
    node: t.typeInstruction(undefined, t.signature([], ["i32"])),
    expected: [0x60, 0x00, 0x01, 0x7f],
  },

  {
    name: "(type (func (param i32)))",
    node: t.typeInstruction(undefined, t.signature([t.funcParam("i32")], [])),
    expected: [0x60, 0x01, 0x7f, 0x00],
  },

  {
    name: "(type (func (param i32) (result i32)))",
    node: t.typeInstruction(
      undefined,
      t.signature([t.funcParam("i32")], ["i32"])
    ),
    expected: [0x60, 0x01, 0x7f, 0x01, 0x7f],
  },

  {
    node: t.sectionMetadata(
      "import",
      0,
      t.numberLiteralFromRaw(1),
      t.numberLiteralFromRaw(0)
    ),
    name: "an empty ImportSection",
    expected: [0x02, 0x01, 0x00],
  },

  {
    name: "(call 0)",
    node: t.callInstruction(t.indexLiteral(0)),
    expected: [0x10, 0x00],
  },

  {
    name: "a CallIndirectInstruction",
    node: callIndirectInstructionIndex(t.indexLiteral(10)),
    expected: [0x11, 0x0a, 0x00],
  },

  {
    name: '(export "a" (func 1))',
    node: t.moduleExport("a", t.moduleExportDescr("Func", t.indexLiteral(1))),
    expected: [0x01, 0x61, 0x00, 0x01],
  },

  {
    name: "a ModuleImport of Table with min 2",
    node: t.moduleImport("a", "b", t.table("anyfunc", t.limit(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x01, 0x70, 0x00, 0x02],
  },

  {
    name: "a ModuleImport of Table with min 2 and max 10",
    node: t.moduleImport("a", "b", t.table("anyfunc", t.limit(2, 10))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x01, 0x70, 0x01, 0x02, 0x0a],
  },

  {
    name: "(get_global 1)",
    node: t.instruction("get_global", [t.indexLiteral(1)]),
    expected: [0x23, 0x01],
  },

  {
    name: "(set_global 1)",
    node: t.instruction("set_global", [t.indexLiteral(1)]),
    expected: [0x24, 0x01],
  },

  {
    name: "(get_local 1)",
    node: t.instruction("get_local", [t.indexLiteral(1)]),
    expected: [0x20, 0x01],
  },

  {
    name: "(global (mut i32) (i32.const 0))",
    node: t.global(t.globalType("i32", "var"), [
      t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
      t.instruction("end"),
    ]),
    expected: [0x7f, 0x01, 0x41, 0x01, 0x0b],
  },

  {
    name: "(global i32 (i32.const 0))",
    node: t.global(t.globalType("i32", "const"), [
      t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
      t.instruction("end"),
    ]),
    expected: [0x7f, 0x00, 0x41, 0x01, 0x0b],
  },

  {
    name: "(func)",
    node: t.func(null, t.signature([], []), [t.instruction("end")]),
    expected: [0x02, 0x00, 0x0b],
  },

  {
    name: "(func (i32.const 1))",
    node: t.func(null, t.signature([], []), [
      t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
      t.instruction("end"),
    ]),
    expected: [0x04, 0x00, 0x41, 0x01, 0x0b],
  },

  {
    name: "(func (unreachable))",
    node: t.func(null, t.signature([], []), [
      t.instruction("unreachable"),
      t.instruction("end"),
    ]),
    expected: [0x03, 0x00, 0x00, 0x0b],
  },

  /**
   * t . const 1
   */
  {
    name: "(i32.const 1)",
    node: t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(1)]),
    expected: [0x41, 0x01],
  },

  {
    name: "(i64.const 1)",
    node: t.objectInstruction("const", "i64", [t.numberLiteralFromRaw(1)]),
    expected: [0x42, 0x01],
  },

  {
    name: "(f32.const 0.1)",
    node: t.objectInstruction("const", "f32", [
      t.floatLiteral(0.1, false, false, "0.1"),
    ]),
    expected: [0x43, 0xcd, 0xcc, 0xcc, 0x3d],
  },

  {
    name: "(f64.const 0.1)",
    node: t.objectInstruction("const", "f64", [
      t.floatLiteral(0.1, false, false, "0.1"),
    ]),
    expected: [0x44, 0x9a, 0x99, 0x99, 0x99, 0x99, 0x99, 0xb9, 0x3f],
  },

  {
    name: "(elem 1 (i32.const 2) 3 4)",
    node: t.elem(
      t.numberLiteralFromRaw(1),
      [
        t.objectInstruction("const", "i32", [t.numberLiteralFromRaw(2)]),
        t.instruction("end"),
      ],
      [t.numberLiteralFromRaw(3), t.numberLiteralFromRaw(4)]
    ),
    expected: [0x01, 0x41, 0x02, 0x0b, 0x02, 0x03, 0x04],
  },

  /**
   * String encoding
   */
  {
    name: "a",
    node: t.stringLiteral("a"),
    expected: [1, 0x61],
  },

  {
    name: "foo",
    node: t.stringLiteral("foo"),
    expected: [3, 0x66, 0x6f, 0x6f],
  },

  {
    name: "./-Ɂ?_¶",
    node: t.stringLiteral("./-Ɂ?_¶"),
    expected: [9, 0x2e, 0x2f, 0x2d, 0xc9, 0x81, 0x3f, 0x5f, 0xc2, 0xb6],
  },

  {
    name: "0123456789 (x13)",
    node: t.stringLiteral("0123456789".repeat(13)),
    expected: [].concat.apply(
      [0x82, 0x01],
      new Array(13).fill([
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
      ])
    ),
  },

  // TODO(sven): utf8 encoder fails here
  // {
  //   name: "🤣见見",
  //   node: t.stringLiteral("🤣见見"),
  //   expected: [10, 0xf0, 0x9f, 0xa4, 0xa3, 0xe8, 0xa7, 0x81, 0xe8, 0xa6, 0x8b]
  // }
];

describe("wasm gen", () => {
  fixtures.forEach((fixture) => {
    it("should generate " + fixture.name, () => {
      const binary = encodeNode(fixture.node);
      assert.deepEqual(binary, fixture.expected);
    });
  });

  it("should encode vector", () => {
    const actual = encoder.encodeVec([1, 2, 3]);
    const expected = [3, 0x01, 0x02, 0x03];

    assert.deepEqual(actual, expected);
  });

  it("should encode an u32 of one byte", () => {
    assert.deepEqual(encoder.encodeU32(5), [0x05]);
  });

  it("should encode an u32 of multiple bytes", () => {
    assert.deepEqual(encoder.encodeU32(0xff1), [241, 31]);
  });
});
