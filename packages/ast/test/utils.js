const t = require("../lib/index");
const { assert } = require("chai");

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
});
