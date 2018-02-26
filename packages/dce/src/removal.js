const { traverse } = require("@webassemblyjs/ast");

function replaceWithEmptyFunc(func) {
  const emptyFunc = {
    type: "Func",
    params: [],
    result: [],
    body: [],
    name: null
  };

  Object.assign(func, emptyFunc);
}
module.exports = function removeFunc(moduleExport, ast) {
  const exportName = moduleExport.name;

  // TODO(sven): test if we actually want to delete a func
  const funcName = moduleExport.descr.id.value;

  // console.log(`Remove unused "${exportName}"`);

  traverse(ast, {
    Func(path) {
      if (path.node.name.value === funcName) {
        replaceWithEmptyFunc(path.node);
        // console.log('\t> remove func');
      }
    },

    ModuleExport(path) {
      if (path.node.name === exportName) {
        // FIXME(sven): here's a hack to hide the node, since this type is not
        // printable
        path.node.type = "deleted";
        // console.log('\t> remove export');
      }
    }
  });
};
