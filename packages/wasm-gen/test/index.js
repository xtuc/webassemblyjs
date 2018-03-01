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
    name: "ModuleImport - should generate a memory export",
    node: t.moduleImport("a", "b", t.memory(t.limits(2))),
    expected: [0x01, 0x61, 0x01, 0x62, 0x02, 0x00, 0x02]
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
});
