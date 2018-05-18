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
    const firstType = t.typeInstruction(undefined, t.signature([], []));
    firstType.loc = locOnCol(10);

    it("should insert the node in an empty module", () => {
      const m = t.module(null, []);
      const n = t.typeInstruction(undefined, t.signature([], []));

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

      const exportNode = t.moduleExport("f", t.moduleExportDescr("Func", 1));

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
      const size = t.numberLiteralFromRaw(10);
      size.loc = locOnCol(10);

      const vectorOfSize = t.numberLiteralFromRaw(1);
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

  describe("shift", () => {
    describe("node", () => {
      it("should shift by position delta", () => {
        const n = t.numberLiteralFromRaw(10);
        n.loc = locOnCol(10);

        t.shiftLoc(n, +10);

        assert.equal(n.loc.start.column, 20);
        assert.equal(n.loc.end.column, 21);
      });

      it("should shift by negative delta", () => {
        const n = t.numberLiteralFromRaw(10);
        n.loc = locOnCol(10);

        t.shiftLoc(n, -10);

        assert.equal(n.loc.start.column, 0);
        assert.equal(n.loc.end.column, 1);
      });
    });

    describe("section", () => {
      it("should shift section metadata by positive delta", () => {
        const program = t.program([]);

        const startOffset = 0;

        const size = t.numberLiteralFromRaw(10);
        size.loc = locOnCol(10);

        const vectorOfSize = t.numberLiteralFromRaw(1);
        vectorOfSize.loc = locOnCol(10);

        const section = t.sectionMetadata(
          "code",
          startOffset,
          size,
          vectorOfSize
        );

        t.shiftSection(program, section, +10);

        assert.equal(section.startOffset, 10);
      });

      it("should shift section and correspondign nodes", () => {
        const type = t.typeInstruction(undefined, t.signature([], []));
        type.loc = locOnCol(10);

        const program = t.program([t.module(null, [type])]);

        const startOffset = 0;

        const size = t.numberLiteralFromRaw(10);
        size.loc = locOnCol(10);

        const vectorOfSize = t.numberLiteralFromRaw(1);
        vectorOfSize.loc = locOnCol(10);

        const section = t.sectionMetadata(
          "type",
          startOffset,
          size,
          vectorOfSize
        );

        t.shiftSection(program, section, +10);

        assert.equal(type.loc.start.column, 20);
      });
    });
  });
});
