const { assert } = require("chai");

const { moduleContextFromModuleAST } = require("../lib");

const contextFromWast = ast => moduleContextFromModuleAST(JSON.parse(ast));

describe("module context", () => {
  describe("start segment", () => {
    it("should return the start function offset", () => {
      const context = contextFromWast(
        '{"type":"Module","id":null,"fields":[{"type":"Func","name":{"type":"Identifier","value":"func_0","raw":""},"signature":{"type":"Signature","params":[],"results":[]},"body":[],"loc":{"start":{"line":3,"column":9},"end":{"line":3,"column":12}}},{"type":"Func","name":{"type":"Identifier","value":"func_1","raw":""},"signature":{"type":"Signature","params":[],"results":[]},"body":[],"loc":{"start":{"line":4,"column":9},"end":{"line":4,"column":12}}},{"type":"Start","index":{"type":"NumberLiteral","value":1,"raw":"1"},"loc":{"start":{"line":5,"column":9},"end":{"line":5,"column":15}}}],"loc":{"start":{"line":2,"column":7},"end":{"line":6,"column":5}}}'
      );

      assert.isOk(context.getStart());
      assert.typeOf(context.getStart(), "number");
      assert.equal(context.getStart(), 1);
    });

    it("should return null if no start function", () => {
      const context = contextFromWast(
        '{"type":"Module","id":null,"fields":[{"type":"Func","name":{"type":"Identifier","value":"func_0","raw":""},"signature":{"type":"Signature","params":[],"results":[]},"body":[],"loc":{"start":{"line":2,"column":15},"end":{"line":2,"column":18}}}],"loc":{"start":{"line":2,"column":7},"end":{"line":2,"column":19}}}'
      );

      assert.isNull(context.getStart());
    });
  });
});
