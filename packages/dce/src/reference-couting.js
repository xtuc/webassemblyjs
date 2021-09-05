const { traverse } = require("@webassemblyjs/ast");

module.exports = function countRefByName(ast, name) {
  let refCount = 0;

  traverse(ast, {
    Identifier({ node, parentPath }) {
      // We don't need to count the export, we are going to remove it aswell
      // that doesn't cover the case of exporting multiple times the same element
      // FIXME(sven): refactor this
      if (parentPath.node.type === "ModuleExportDescr") {
        return;
      }

      if (node.value === name) {
        refCount++;
      }
    },
  });

  return refCount;
};
