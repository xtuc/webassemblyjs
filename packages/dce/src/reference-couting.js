const { traverse } = require("@webassemblyjs/ast");

module.exports = function countRefByName(ast, name) {
  let refCount = 0;

  traverse(ast, {
    Identifier({ node }) {
      if (node.value === name) {
        refCount++;
      }
    }
  });

  return refCount;
};
