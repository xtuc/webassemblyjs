const t = require("@webassemblyjs/ast");

const emptyFunc = t.func(null, [], [], []);

module.exports = function removeFunc(moduleExport, ast) {
  const exportName = moduleExport.name;

  // TODO(sven): test if we actually want to delete a func
  const funcName = moduleExport.descr.id.value;

  // console.log(`Remove unused "${exportName}"`);

  t.traverse(ast, {
    Func(path) {
      if (path.node.name.value === funcName) {
        path.replaceWith(emptyFunc);
        // console.log('\t> remove func');
      }
    },

    ModuleExport(path) {
      if (path.node.name === exportName) {
        path.remove();
        // console.log('\t> remove export');
      }
    }
  });
};
