// @flow

const {malloc, set} = require('../../kernel/memory');
const {traverse} = require('../../../compiler/AST/traverse');
const func = require('./func');

function createInstance(n: Module): ModuleInstance {

  // Keep a ref to the module instance
  const moduleInstance = {
    types: [],

    funcaddrs: [],
    tableaddrs: [],
    memaddrs: [],
    globaladdrs: [],

    exports: [],
  };

  /**
   * Keep the function that were instantiated and re-use their addr in
   * the export wrapper
   */
  const instantiatedFuncs = {};

  /**
   * Instantiate the function in the module
   */
  traverse(n, {

    Func({node}: NodePath<Func>) {
      const funcinstance = func.createInstance(node, moduleInstance);

      const addr = malloc(1 /* size of the funcinstance struct */);
      set(addr, funcinstance);

      moduleInstance.funcaddrs.push(addr);

      if (typeof node.id === 'string') {
        instantiatedFuncs[node.id] = addr;
      }
    }

  });

  traverse(n, {

    ModuleExport({node}: NodePath<ModuleExport>) {

      if (node.descr.type === 'Func') {
        const instantiatedFuncAddr = instantiatedFuncs[node.descr.id];

        if (typeof instantiatedFuncs === 'undefined') {
          throw new Error(
            'Cannot create exportinst: function ' + node.descr.id
            + ' was not declared or instantiated'
          );
        }

        const externalVal = {
          type: node.descr.type,
          addr: instantiatedFuncAddr,
        };

        moduleInstance.exports.push(
          createModuleExportIntance(node.name, externalVal)
        );
      }
    },

  });

  return moduleInstance;
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
