// @flow

const {malloc, ptrsize} = require('../../kernel/memory');
const {traverse} = require('../../../compiler/AST/traverse');

function createInstance(n: Module): ModuleInstance {
  const exports = [];
  const types = [];

  traverse(n, {

    ModuleExport(path) {
      const node: ModuleExport = path.node;

      if (node.descr.type === 'Func') {

        const addr = malloc(ptrsize);

        const externalVal = {
          type: node.descr.type,
          addr,
        };

        exports.push(
          createModuleExportIntance(node.name, externalVal)
        );
      }
    }

  });

  return {
    exports,
    types,
  };
}

function createModuleExportIntance(
  name: string,
  value: ExternalVal,
): ExportInstance {
  return {
    name,
    value,
  };
}

module.exports = {
  createInstance,
};
