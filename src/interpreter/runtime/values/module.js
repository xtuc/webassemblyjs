// @flow

const importObjectUtils = require("../../import-object");
const { traverse } = require("../../../compiler/AST/traverse");
const func = require("./func");
const global = require("./global");
const { LinkError, CompileError } = require("../../../errors");

export function createInstance(
  allocator: Allocator,
  n: Module,
  externalFunctions: any = {}
): ModuleInstance {
  // Keep a ref to the module instance
  const moduleInstance = {
    types: [],

    funcaddrs: [],
    tableaddrs: [],
    memaddrs: [],
    globaladdrs: [],

    exports: []
  };

  /**
   * Keep the function that were instantiated and re-use their addr in
   * the export wrapper
   */
  const instantiatedFuncs = {};
  const instantiatedGlobals = {};

  importObjectUtils.walk(externalFunctions, (key, key2, jsfunc) => {
    const funcinstance = func.createExternalInstance(jsfunc);

    const addr = allocator.malloc(1 /* size of the funcinstance struct */);
    allocator.set(addr, funcinstance);

    instantiatedFuncs[`${key}_${key2}`] = addr;
  });

  /**
   * Instantiate the function in the module
   */
  traverse(n, {
    Func({ node }: NodePath<Func>) {
      // Only instantiate/allocate our own functions
      if (node.isExternal === true) {
        return;
      }

      const funcinstance = func.createInstance(node, moduleInstance);

      const addr = allocator.malloc(1 /* size of the funcinstance struct */);
      allocator.set(addr, funcinstance);

      moduleInstance.funcaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          instantiatedFuncs[node.name.value] = addr;
        }
      }
    },

    Global({ node }: NodePath<Global>) {
      const globalinstance = global.createInstance(allocator, node);

      const addr = allocator.malloc(1 /* size of the globalinstance struct */);
      allocator.set(addr, globalinstance);

      moduleInstance.globaladdrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          instantiatedGlobals[node.name.value] = {
            addr,
            type: node.globalType
          };
        }
      }
    },

    ModuleImport({ node }: NodePath<ModuleImport>) {
      const instantiatedFuncAddr =
        instantiatedFuncs[`${node.module}_${node.name}`];

      if (node.descr.type === "FuncImportDescr") {
        if (typeof instantiatedFuncAddr === "undefined") {
          throw new Error(
            "Can not import function " +
              node.name +
              " was not declared or instantiated"
          );
        }

        /**
         * Add missing type informations:
         * - params
         * - results
         */
        const func = allocator.get(instantiatedFuncAddr);

        if (node.descr.params != null && node.descr.results != null) {
          func.type = [node.descr.params, node.descr.results];
        }

        allocator.set(func, instantiatedFuncAddr);

        moduleInstance.funcaddrs.push(instantiatedFuncAddr);
      } else {
        throw new Error("Unsupported import of type: " + node.descr.type);
      }
    }
  });

  traverse(n, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        const instantiatedFuncAddr = instantiatedFuncs[node.descr.id.value];

        if (typeof instantiatedFuncs === "undefined") {
          throw new Error(
            "Cannot create exportinst: function " +
              node.descr.id.value +
              " was not declared or instantiated"
          );
        }

        const externalVal = {
          type: node.descr.type,
          addr: instantiatedFuncAddr
        };

        moduleInstance.exports.push(
          createModuleExportIntance(node.name, externalVal)
        );
      }

      if (node.descr.type === "Global") {
        // Referenced by its index in the module.globaladdrs
        if (node.descr.id.type === "NumberLiteral") {
          const index = node.descr.id.value;

          const globalinstaddr = moduleInstance.globaladdrs[index];

          if (globalinstaddr == null) {
            throw new CompileError("Unknown global");
          }

          const externalVal = {
            type: node.descr.type,
            addr: globalinstaddr
          };

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }

        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
          const instantiatedGlobal = instantiatedGlobals[node.descr.id.value];

          if (instantiatedGlobal.type.mutability === "var") {
            throw new CompileError("Mutable globals cannot be exported");
          }

          if (instantiatedGlobal.type.valtype === "i64") {
            throw new LinkError("Export of globals of type i64 is not allowed");
          }

          const externalVal = {
            type: node.descr.type,
            addr: instantiatedGlobal.addr
          };

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }
      }
    }
  });

  return moduleInstance;
}

function createModuleExportIntance(
  name: string,
  value: ExternalVal
): ExportInstance {
  return {
    name,
    value
  };
}
