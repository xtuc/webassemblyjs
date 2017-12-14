// @flow

const {traverse} = require('../../../compiler/AST/traverse');
const func = require('./func');
const global = require('./global');

function createInstance(
  allocator: Allocator,
  n: Module,
  externalFunctions: any = {},
): ModuleInstance {

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

  Object.keys(externalFunctions).forEach((funckey) => {
    const jsfunc = externalFunctions[funckey];
    const funcinstance = func.createExternalInstance(jsfunc);

    const addr = allocator.malloc(1 /* size of the funcinstance struct */);
    allocator.set(addr, funcinstance);

    instantiatedFuncs[funckey] = addr;
  });

  /**
   * Instantiate the function in the module
   */
  traverse(n, {

    Func({node}: NodePath<Func>) {
      const funcinstance = func.createInstance(node, moduleInstance);

      const addr = allocator.malloc(1 /* size of the funcinstance struct */);
      allocator.set(addr, funcinstance);

      moduleInstance.funcaddrs.push(addr);

      if (typeof node.id === 'string') {
        instantiatedFuncs[node.id] = addr;
      }
    },

    Global({node}: NodePath<Global>) {
      const globalinstance = global.createInstance(allocator, node);

      const addr = allocator.malloc(1 /* size of the funcinstance struct */);
      allocator.set(addr, globalinstance);

      moduleInstance.globaladdrs.push(addr);
    },

    ModuleImport({node}: NodePath<ModuleImport>) {
      const instantiatedFuncAddr = instantiatedFuncs[node.name];

      if (node.descr.type === 'FuncImportDescr') {

        if (typeof instantiatedFuncAddr === 'undefined') {
          throw new Error(
            'Cannot import function ' + node.name
            + ' was not declared or instantiated'
          );
        }

        /**
         * Add missing type informations:
         * - params
         * - results
         */
        const func = allocator.get(instantiatedFuncAddr);
        func.type = [
          node.descr.params,
          node.descr.results,
        ];

        allocator.set(func, instantiatedFuncAddr);

        moduleInstance.funcaddrs.push(instantiatedFuncAddr);

      } else {
        throw new Error('Unsupported import of type: ' + node.descr.type);
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
