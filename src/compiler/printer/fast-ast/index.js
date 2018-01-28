// @flow

const { traverse } = require("../../AST/traverse");
const t = require("../../AST");

let i = 0;

function generateUniqueId() {
  i++;

  return "unknown_" + i;
}

export function print(ast: Node) {
  const out = {
    imports: [],
    exports: {},
    functions: {},
    globals: []
  };

  traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        out.exports[node.descr.id.value] = node;
      }
    },

    Func({ node }: NodePath<Func>) {
      if (typeof node.name !== "string") {
        node.name = t.identifier(generateUniqueId());
      }

      out.functions[node.name.value] = node;
    },

    Global({ node }: NodePath<Global>) {
      out.globals.push(node.globalType);
    },

    ModuleImport({ node }: NodePath<ModuleImport>) {
      out.imports.push(node);
    }
  });

  console.log(JSON.stringify(out, null, 4));
}
