// @flow

const {traverse} = require('../compiler/AST/traverse');
const {createInstance} = require('./runtime/values/module');

export function evaluateAst(ast: Node): UserlandModuleInstance {
  const exports = {};

  traverse(ast, {

    Module(path) {
      const node: Module = path.node;

      const instance = createInstance(node);

      instance.exports.forEach((exportinst) => {
        exports[exportinst.name] = function () {
          console.log('call', exportinst.value.type, 'at', exportinst.value.addr.index);
        };
      });
    }

  });

  return {
    exports,
  };
}
