// @flow
const { assert } = require("chai");

const { traverse } = require("../lib/traverse");
const t = require("../lib/index");

describe("AST traverse", () => {
  it("should traverse a node", () => {
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

  it("should be called once per node", () => {
    const node = t.module("test", []);
    let nb = 0;

    traverse(node, {
      Module() {
        nb++;
      }
    });

    assert.equal(nb, 1);
  });

  it("should call the special Node visitor", () => {
    const node = t.module("test", []);
    let called = false;

    traverse(node, {
      Node() {
        called = true;
      }
    });

    assert.isTrue(called, "Module visitor has not been called");
  });

  it("should throw if an unknown node type is encountered", () => {
    const node = t.stringLiteral("fish");
    node.type = "foo";

    assert.throws(() => traverse(node, {}), "Unexpected node type foo");
  });

  describe("parent path", () => {
    it("should retain the parent path", () => {
      const root = t.module("test", [t.func(null, t.signature([], []), [])]);
      let called = false;

      traverse(root, {
        Func(path) {
          assert.isObject(path.parentPath);
          assert.equal(path.parentPath.node.type, "Module");

          called = true;
        }
      });

      assert.isTrue(called, "visitor has not been called");
    });

    it("should be empty at the root node", () => {
      const root = t.module("test", []);
      let called = false;

      traverse(root, {
        Module(path) {
          assert.isNull(path.parentPath);
          called = true;
        }
      });

      assert.isTrue(called, "visitor has not been called");
    });
  });

  describe("NodePath remove", () => {
    it("should remove func in module", () => {
      const root = t.module("test", [t.func(null, t.signature([], []), [])]);

      traverse(root, {
        Func(path) {
          path.remove();
        }
      });

      assert.lengthOf(root.fields, 0);
    });

    it("should remove export in module", () => {
      const root = t.module("test", [
        t.moduleExport("a", t.moduleExportDescr("Func", t.indexLiteral(0)))
      ]);

      traverse(root, {
        ModuleExport(path) {
          path.remove();
        }
      });

      assert.lengthOf(root.fields, 0);
    });

    it("should remove instruction in func", () => {
      const func = t.func(null, t.signature([], []), [t.instruction("nop")]);

      traverse(func, {
        Instr(path) {
          path.remove();
        }
      });

      assert.lengthOf(func.body, 0);
    });
  });

  describe("NodePath replace", () => {
    it("should remove func in module", () => {
      const func = t.func(null, t.signature([], []), [t.instruction("nop")]);

      traverse(func, {
        Instr(path) {
          const newNode = t.callInstruction(t.indexLiteral(0));
          path.replaceWith(newNode);
        }
      });

      assert.equal(func.body[0].type, "CallInstruction");
    });
  });

  describe("find parent", () => {
    it("should throw if no parent", () => {
      const root = t.instruction("nop");

      traverse(root, {
        Node(path) {
          const fn = () => path.findParent(() => {});
          assert.throws(fn);
        }
      });
    });

    it("should find parent until the root", () => {
      const m = t.module("test", [
        t.func(null, t.signature([], []), [t.instruction("nop")])
      ]);

      const typesFound = [];

      traverse(m, {
        Instr(path) {
          path.findParent(({ node }) => {
            typesFound.push(node.type);
          });
        }
      });

      assert.deepEqual(typesFound, ["Func", "Module"]);
    });

    it("should find parent until false", () => {
      const m = t.module("test", [
        t.func(null, t.signature([], []), [t.instruction("nop")])
      ]);

      const typesFound = [];

      traverse(m, {
        Instr(path) {
          path.findParent(({ node }) => {
            typesFound.push(node.type);

            if (node.type === "Func") {
              return false;
            }
          });
        }
      });

      assert.deepEqual(typesFound, ["Func"]);
    });
  });
});
