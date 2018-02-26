// @flow
const { assert } = require("chai");

const { traverse } = require("../lib/traverse");
const t = require("../lib/index");

describe("AST traverse", () => {
  it("Should traverse a node", () => {
    const node = t.module("test", []);
    let called = false;

    traverse(node, {
      Module(path) {
        assert.equal(path.node.type, node.type);
        assert.equal(path.node.id, node.id);

        called = true;
      }
    });

    assert.isTrue(called, "Module visitor has not been called");
  });
});
