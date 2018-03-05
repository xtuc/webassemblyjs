const { assert } = require("chai");
const t = require("@webassemblyjs/ast");

const { encodeNode } = require("../lib");
const encoder = require("../lib/encoder");

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
    name: "should generate a memory ModuleImport",
    node: t.moduleImport("a", "b", t.memory(t.limits(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x02, 0x00, 0x02]
  },

  {
    name: "should generate a func(): i32 ModuleImport",
    node: t.moduleImport(
      "a",
      "b",
      t.funcImportDescr(t.indexLiteral(0), [], ["i32"])
    ),
    expected: [0x01, 0x61, 0x01, 0x62, 0x00, 0x00]
  },

  {
    name: "should generate func type func(): i32",
    node: t.typeInstructionFunc([], ["i32"]),
    expected: [0x60, 0x00, 0x01, 0x7f]
  },

  {
    name: "should generate func type func(i32)",
    node: t.typeInstructionFunc([t.funcParam("i32")], []),
    expected: [0x60, 0x01, 0x7f, 0x00]
  },

  {
    name: "should generate func type func(i32): i32",
    node: t.typeInstructionFunc([t.funcParam("i32")], ["i32"]),
    expected: [0x60, 0x01, 0x7f, 0x01, 0x7f]
  },

  {
    name: "should generate an empty ImportSection",
    node: t.sectionMetadata("import", 0, 1, 0),
    expected: [0x02, 0x01, 0x00]
  },

  {
    name: "should generate a CallInstruction",
    node: t.callInstruction(t.indexLiteral(0)),
    expected: [0x10, 0x00]
  },

  {
    name: "should generate a ModuleExport of func 1",
    node: t.moduleExport("a", "Func", t.indexLiteral(1)),
    expected: [0x01, 0x61, 0x00, 0x01]
  }
];

describe("wasm gen", () => {
  fixtures.forEach(fixture => {
    it(fixture.name, () => {
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
