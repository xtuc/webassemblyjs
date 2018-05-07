const t = require("../lib/index");
const { assert } = require("chai");

function locOnCol(n) {
  return {
    start: { line: -1, column: n },
    end: { line: -1, column: n + 1 }
  };
}

describe("AST utils", () => {
  it("should sort section metadata", () => {
    const fakeModule = {
      metadata: {
        sections: [
          {
            section: "data"
          },
          {
            section: "global"
          },
          {
            section: "type"
          }
        ]
      }
    };

    t.sortSectionMetadata(fakeModule);

    const sections = fakeModule.metadata.sections.map(x => x.section).join(",");

    assert.equal(sections, "type,global,data");
  });

  describe("ordered insert", () => {
    const firstType = t.typeInstructionFunc([], []);
    firstType.loc = locOnCol(10);

    it("should insert the node in an empty module", () => {
      const m = t.module(null, []);
      const n = t.typeInstructionFunc([], []);

      n.loc = locOnCol(1);

      t.orderedInsertNode(m, n);

      const nodes = m.fields.map(x => x.type);

      assert.deepEqual(nodes, ["TypeInstruction"]);
    });

    it("should insert the node before another one", () => {
      const m = t.module(null, [firstType]);

      const n = t.blockComment("");
      n.loc = locOnCol(1);

      t.orderedInsertNode(m, n);

      const nodes = m.fields.map(x => x.type);

      assert.deepEqual(nodes, ["BlockComment", "TypeInstruction"]);
    });

    it("should insert the node after another one", () => {
      const m = t.module(null, [firstType]);

      const n = t.blockComment("");
      n.loc = locOnCol(100);

      t.orderedInsertNode(m, n);

      const nodes = m.fields.map(x => x.type);

      assert.deepEqual(nodes, ["TypeInstruction", "BlockComment"]);
    });

    it("should add ModuleImport and ModuleExport and the end", () => {
      const m = t.module(null, [firstType]);

      const exportNode = t.moduleExport("f", "Func", 1);

      exportNode.loc = locOnCol(1);

      t.orderedInsertNode(m, exportNode);

      t.orderedInsertNode(m, firstType);

      const nodes = m.fields.map(x => x.type);

      assert.deepEqual(nodes, [
        "TypeInstruction",
        "TypeInstruction",
        "ModuleExport"
      ]);
    });
  });

  describe("assert has loc", () => {
    it("should throw when no location", () => {
      const n = t.blockComment("");
      const fn = () => t.assertHasLoc(n);

      assert.throws(fn, "no location");
    });

    it("should NOT throw when no location", () => {
      const n = t.blockComment("");
      n.loc = locOnCol(100);

      t.assertHasLoc(n);
    });
  });

  describe("get end of section", () => {
    it("should get the end of the section", () => {
      const startOffset = 0;
      const size = t.numberLiteral(10);
      size.loc = locOnCol(10);

      const vectorOfSize = t.numberLiteral(1);
      vectorOfSize.loc = locOnCol(10);

      const section = t.sectionMetadata(
        "code",
        startOffset,
        size,
        vectorOfSize
      );

      const end = t.getEndOfSection(section);

      assert.typeOf(end, "number");
      assert.equal(end, 11);
    });
  });
});
