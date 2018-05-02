const { assert } = require("chai");
const t = require("@webassemblyjs/ast");

const { encodeNode } = require("../lib");
const encoder = require("../lib/encoder");

function callIndirectInstructionIndex(index) {
  return {
    type: "CallIndirectInstruction",
    index
  };
}

const fixtures = [
  {
    name: "ModuleImport - should generate a i32 global",
    node: t.moduleImport("a", "b", t.globalImportDescr("i32", "const")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7f, 0x00]
  },

  {
    name: "ModuleImport - should generate a i64 global",
    node: t.moduleImport("a", "b", t.globalImportDescr("i64", "const")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7e, 0x00]
  },

  {
    name: "ModuleImport - should generate a mutable i32 global",
    node: t.moduleImport("a", "b", t.globalImportDescr("i32", "var")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7f, 0x01]
  },

  {
    name: "ModuleImport - should generate a mutable i64 global",
    node: t.moduleImport("a", "b", t.globalImportDescr("i64", "var")),
    expected: [0x01, 0x61, 0x01, 0x62, 0x03, 0x7e, 0x01]
  },

  {
    name: "a memory ModuleImport",
    node: t.moduleImport("a", "b", t.memory(t.limits(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x02, 0x00, 0x02]
  },

  {
    name: "a func(): i32 ModuleImport",
    node: t.moduleImport(
      "a",
      "b",
      t.funcImportDescr(t.indexLiteral(0), [], ["i32"])
    ),
    expected: [0x01, 0x61, 0x01, 0x62, 0x00, 0x00]
  },

  {
    name: "(type (func))",
    node: t.typeInstructionFunc([], []),
    expected: [0x60, 0x00, 0x00]
  },

  {
    name: "(type (func (result i32)))",
    node: t.typeInstructionFunc([], ["i32"]),
    expected: [0x60, 0x00, 0x01, 0x7f]
  },

  {
    name: "(type (func (param i32)))",
    node: t.typeInstructionFunc([t.funcParam("i32")], []),
    expected: [0x60, 0x01, 0x7f, 0x00]
  },

  {
    name: "(type (func (param i32) (result i32)))",
    node: t.typeInstructionFunc([t.funcParam("i32")], ["i32"]),
    expected: [0x60, 0x01, 0x7f, 0x01, 0x7f]
  },

  {
    node: t.sectionMetadata(
      "import",
      0,
      t.numberLiteral(1),
      t.numberLiteral(0)
    ),
    name: "an empty ImportSection",
    expected: [0x02, 0x01, 0x00]
  },

  {
    name: "(call 0)",
    node: t.callInstruction(t.indexLiteral(0)),
    expected: [0x10, 0x00]
  },

  {
    name: "a CallIndirectInstruction",
    node: callIndirectInstructionIndex(t.indexLiteral(10)),
    expected: [0x11, 0x0a, 0x00]
  },

  {
    name: '(export "a" (func 1))',
    node: t.moduleExport("a", "Func", t.indexLiteral(1)),
    expected: [0x01, 0x61, 0x00, 0x01]
  },

  {
    name: "a ModuleImport of Table with min 2",
    node: t.moduleImport("a", "b", t.table("anyfunc", t.limits(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x01, 0x70, 0x00, 0x02]
  },

  {
    name: "a ModuleImport of Table with min 2 and max 10",
    node: t.moduleImport("a", "b", t.table("anyfunc", t.limits(2, 10))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x01, 0x70, 0x01, 0x02, 0x0a]
  },

  {
    name: "(get_global 1)",
    node: t.instruction("get_global", [t.indexLiteral(1)]),
    expected: [0x23, 0x01]
  },

  {
    name: "(set_global 1)",
    node: t.instruction("set_global", [t.indexLiteral(1)]),
    expected: [0x24, 0x01]
  },

  {
    name: "(get_local 1)",
    node: t.instruction("get_local", [t.indexLiteral(1)]),
    expected: [0x20, 0x01]
  },

  {
    name: "(global (mut i32) (i32.const 0))",
    node: t.global(t.globalType("i32", "var"), [
      t.objectInstruction("const", "i32", [t.numberLiteral(1)])
    ]),
    expected: [0x7f, 0x01, 0x41, 0x01, 0x0b]
  },

  {
    name: "(global i32 (i32.const 0))",
    node: t.global(t.globalType("i32", "const"), [
      t.objectInstruction("const", "i32", [t.numberLiteral(1)])
    ]),
    expected: [0x7f, 0x00, 0x41, 0x01, 0x0b]
  },

  {
    name: "(func)",
    node: t.func(null, [], [], []),
    expected: [0x02, 0x00, 0x0b]
  },

  {
    name: "(func (i32.const 1))",
    node: t.func(
      null,
      [],
      [],
      [t.objectInstruction("const", "i32", [t.numberLiteral(1)])]
    ),
    expected: [0x04, 0x00, 0x41, 0x01, 0x0b]
  },

  {
    name: "(func (unreachable))",
    node: t.func(null, [], [], [t.instruction("unreachable")]),
    expected: [0x03, 0x00, 0x00, 0x0b]
  }
];

describe("wasm gen", () => {
  fixtures.forEach(fixture => {
    it("should generate " + fixture.name, () => {
      const binary = encodeNode(fixture.node);
      assert.deepEqual(binary, fixture.expected);
    });
  });

  describe("encode UTF8 vec", () => {
    it("should encode `foo`", () => {
      const actual = encoder.encodeUTF8Vec("foo");
      const expected = [3, 0x66, 0x6f, 0x6f];

      assert.deepEqual(actual, expected);
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
