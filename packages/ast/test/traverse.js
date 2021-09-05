// @flow
const { assert } = require("chai");

const { traverse } = require("../lib/traverse");
const t = require("../lib/index");

describe("AST traverse", () => {
  describe("traversal", () => {
    it("should traverse a node", () => {
      const node = t.module("test", []);
      let called = false;

      traverse(node, {
        Module(path) {
          assert.equal(path.node.type, node.type);
          assert.equal(path.node.id, node.id);

          called = true;
        },
      });

      assert.isTrue(called, "Module visitor has not been called");
    });

    it("should be called once per node", () => {
      const node = t.module("test", []);
      let nb = 0;

      traverse(node, {
        Module() {
          nb++;
        },
      });

      assert.equal(nb, 1);
    });

    it("should support traversing union types", () => {
      const node = t.module("test", []);
      let called = false;

      traverse(node, {
        Node() {
          called = true;
        },
      });

      assert.isTrue(called, "Module visitor has not been called");
    });

    it("should throw if an unknown node type is encountered", () => {
      const node = t.stringLiteral("fish");
      node.type = "foo";

      assert.throws(() => traverse(node, {}), "Unexpected node type foo");
    });

    it("should throw if the visitor is not a known node or union type", () => {
      const node = t.stringLiteral("fish");
      assert.throws(
        () =>
          traverse(node, {
            NotANode() {},
          }),
        "Unexpected visitor NotANode"
      );
    });
  });

  describe("node path context", () => {
    it("should retain the parent path", () => {
      const root = t.module("test", [t.func(null, t.signature([], []), [])]);
      let called = false;

      traverse(root, {
        Func(path) {
          assert.isObject(path.parentPath);
          assert.equal(path.parentPath.node.type, "Module");
          called = true;
        },
      });

      assert.isTrue(called, "visitor has not been called");
    });

    it("should have an empty parent path the root node", () => {
      const root = t.module("test", []);
      let called = false;

      traverse(root, {
        Module(path) {
          assert.isNull(path.parentPath);
          called = true;
        },
      });

      assert.isTrue(called, "visitor has not been called");
    });

    it("should set the parentKey", () => {
      const root = t.module("test", [t.func(null, t.signature([], []), [])]);
      let called = false;

      traverse(root, {
        Func(path) {
          assert.isObject(path.parentPath);
          assert.equal(path.parentKey, "fields");
          called = true;
        },
      });

      assert.isTrue(called, "visitor has not been called");
    });

    it("should set inList", () => {
      const m = t.module("test", [
        t.func(null, t.signature([], []), [t.instruction("nop")]),
      ]);

      traverse(m, {
        Module(path) {
          assert.isFalse(path.inList);
        },
        Func(path) {
          assert.isTrue(path.inList);
        },
      });
    });
  });

  describe("node path operations", () => {
    describe("stop", () => {
      it("should halt traversal", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Func(path) {
            path.stop();
          },
          Signature() {
            assert.isTrue(
              false,
              "traversal should have halted before this node"
            );
          },
        });
      });
    });

    describe("insert before", () => {
      it("should insert at the start of a list of nodes", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Func(path) {
            path.insertBefore(t.global(t.globalType("i32", "var"), []));
          },
        });

        assert.lengthOf(root.fields, 2);
        assert.equal(root.fields[0].type, "Global");
        assert.equal(root.fields[1].type, "Func");
      });

      it("should insert at the middle of a list of nodes", () => {
        const root = t.module("test", [
          t.func(t.identifier("foo"), t.signature([], []), []),
          t.func(t.identifier("bar"), t.signature([], []), []),
        ]);

        traverse(root, {
          Func(path) {
            if (path.node.name.value === "bar") {
              path.insertBefore(t.global(t.globalType("i32", "var"), []));
            }
          },
        });

        assert.lengthOf(root.fields, 3);
        assert.equal(root.fields[0].type, "Func");
        assert.equal(root.fields[1].type, "Global");
        assert.equal(root.fields[2].type, "Func");
      });

      it("should throw if invoked on an element that is not in a list", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        assert.throws(
          () =>
            traverse(root, {
              Module(path) {
                path.insertBefore(t.global(t.globalType("i32", "var"), []));
              },
            }),
          "insert can only be used for nodes that are within lists"
        );
      });
    });

    describe("insert after", () => {
      it("should insert at the end of a list of nodes", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Func(path) {
            path.insertAfter(t.global(t.globalType("i32", "var"), []));
          },
        });

        assert.lengthOf(root.fields, 2);
        assert.equal(root.fields[0].type, "Func");
        assert.equal(root.fields[1].type, "Global");
      });

      it("should insert at the middle of a list of nodes", () => {
        const root = t.module("test", [
          t.func(t.identifier("foo"), t.signature([], []), []),
          t.func(t.identifier("bar"), t.signature([], []), []),
        ]);

        traverse(root, {
          Func(path) {
            if (path.node.name.value === "foo") {
              path.insertAfter(t.global(t.globalType("i32", "var"), []));
            }
          },
        });

        assert.lengthOf(root.fields, 3);
        assert.equal(root.fields[0].type, "Func");
        assert.equal(root.fields[1].type, "Global");
        assert.equal(root.fields[2].type, "Func");
      });

      it("should throw if invoked on an element that is not in a list", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        assert.throws(
          () =>
            traverse(root, {
              Module(path) {
                path.insertAfter(t.global(t.globalType("i32", "var"), []));
              },
            }),
          "insert can only be used for nodes that are within lists"
        );
      });
    });

    describe("remove", () => {
      it("should remove nodes when they have siblings", () => {
        const root = t.module("test", [
          t.func(t.identifier("foo"), t.signature([], []), []),
          t.func(t.identifier("bar"), t.signature([], []), []),
        ]);

        traverse(root, {
          Func(path) {
            if (path.node.name.value === "bar") {
              path.remove();
            }
          },
        });

        assert.lengthOf(root.fields, 1);
        assert.equal(root.fields[0].name.value, "foo");
      });

      it("should remove nodes when they are not children of list properties", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Signature(path) {
            path.remove();
          },
        });

        assert.equal(root.fields[0].signature, null);
      });

      it("should remove func in module", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Func(path) {
            path.remove();
          },
        });

        assert.lengthOf(root.fields, 0);
      });

      it("should remove export in module", () => {
        const root = t.module("test", [
          t.moduleExport("a", t.moduleExportDescr("Func", t.indexLiteral(0))),
        ]);

        traverse(root, {
          ModuleExport(path) {
            path.remove();
          },
        });

        assert.lengthOf(root.fields, 0);
      });

      it("should remove instruction in func", () => {
        const func = t.func(null, t.signature([], []), [t.instruction("nop")]);

        traverse(func, {
          Instr(path) {
            path.remove();
          },
        });

        assert.lengthOf(func.body, 0);
      });
    });

    describe("replace", () => {
      it("should replace within list properties that have single items", () => {
        const func = t.func(null, t.signature([], []), [t.instruction("nop")]);

        traverse(func, {
          Instr(path) {
            const newNode = t.callInstruction(t.indexLiteral(0));
            path.replaceWith(newNode);
          },
        });

        assert.equal(func.body[0].type, "CallInstruction");
      });

      it("should replace within list properties that have multiple items", () => {
        const root = t.module("test", [
          t.func(t.identifier("foo"), t.signature([], []), []),
          t.func(t.identifier("bar"), t.signature([], []), []),
          t.func(t.identifier("baz"), t.signature([], []), []),
        ]);

        traverse(root, {
          Func(path) {
            if (path.node.name.value === "bar") {
              const newNode = t.callInstruction(t.indexLiteral(0));
              path.replaceWith(newNode);
            }
          },
        });

        assert.equal(root.fields[1].type, "CallInstruction");
      });

      it("should replace non list properties", () => {
        const root = t.module("test", [t.func(null, t.signature([], []), [])]);

        traverse(root, {
          Signature(path) {
            const newNode = t.callInstruction(t.indexLiteral(0));
            path.replaceWith(newNode);
          },
        });

        assert.equal(root.fields[0].signature.type, "CallInstruction");
      });
    });

    describe("find parent", () => {
      it("should throw if no parent", () => {
        const root = t.instruction("nop");

        traverse(root, {
          Node(path) {
            const fn = () => path.findParent(() => {});
            assert.throws(fn);
          },
        });
      });

      it("should find parent until the root", () => {
        const m = t.module("test", [
          t.func(null, t.signature([], []), [t.instruction("nop")]),
        ]);

        const typesFound = [];

        traverse(m, {
          Instr(path) {
            path.findParent(({ node }) => {
              typesFound.push(node.type);
            });
          },
        });

        assert.deepEqual(typesFound, ["Func", "Module"]);
      });

      it("should find parent until false", () => {
        const m = t.module("test", [
          t.func(null, t.signature([], []), [t.instruction("nop")]),
        ]);

        const typesFound = [];

        traverse(m, {
          Instr(path) {
            const foundNode = path.findParent(({ node }) => {
              typesFound.push(node.type);

              if (node.type === "Func") {
                return false;
              }
            });

            assert.equal(foundNode.type, "Func");
          },
        });

        assert.deepEqual(typesFound, ["Func"]);
      });
    });
  });
});
