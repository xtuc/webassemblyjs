// @flow

const {traverse} = require('../../AST/traverse');

let i = 0;

function generateUniqueId() {
  i++;

  return 'unknown_' + i;
}

export function print(ast: Node) {
  const out = {
    imports: [],
    exports: {},
    functions: {},
    globals: [],
  };

  traverse(ast, {

    ModuleExport({node}: NodePath<ModuleExport>) {

      if (node.descr.type === 'Func') {
        out.exports[node.descr.id] = node;
      }

    },

    Func({node}: NodePath<Func>) {

      if (typeof node.id !== 'string') {
        node.id = generateUniqueId();
      }

      out.functions[node.id] = node;
    },

    Global({node}: NodePath<Global>) {
      out.globals.push(node.globalType);
    },

    ModuleImport({node}: NodePath<ModuleImport>) {
      out.imports.push(node);
    },

  });

  console.log(
    JSON.stringify(out, null, 4)
  );
}
