// @flow

const importObjectUtils = require("../../import-object");
const { traverse } = require("../../../compiler/AST/traverse");
const func = require("./func");
const global = require("./global");
const { LinkError, CompileError } = require("../../../errors");

export function createInstance(
  allocator: Allocator,
  n: Module,
  externalElements: any = {}
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
  const instantiatedTables = {};
  const instantiatedMemories = {};

  const instantiatedImportedElements = {};

  function assertNotAlreadyExported(str) {
    const moduleInstanceExport = moduleInstance.exports.find(
      ({ name }) => name === str
    );

    if (moduleInstanceExport !== undefined) {
      throw new CompileError("Duplicate export name");
    }
  }

  importObjectUtils.walk(externalElements, (key, key2, element) => {
    let addr;

    if (key === "_internalInstanceOptions") {
      return;
    }

    if (typeof element === "function") {
      const funcinstance = func.createExternalInstance(element);

      addr = allocator.malloc(1 /* size of the funcinstance struct */);
      allocator.set(addr, funcinstance);
    }

    if (typeof element === "number") {
      // TODO(sven): create an i32 instance
      const funcinstance = func.createExternalInstance(element);

      addr = allocator.malloc(1 /* size of the funcinstance struct */);
      allocator.set(addr, funcinstance);
    }

    if (addr == null) {
      throw new Error(
        `Unsupported import ${key}.${key2}, type of ${typeof element}`
      );
    }

    instantiatedImportedElements[`${key}_${key2}`] = addr;

    // > the indices of imports go before the first index of any definition
    // contained in the module itself.
    // see https://webassembly.github.io/spec/core/syntax/modules.html#imports
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

    Table({ node }: NodePath<Table>) {
      // TODO(sven): implement exporting a Table instance
      const tableinstance = null;

      const addr = allocator.malloc(1 /* size of the tableinstance struct */);
      allocator.set(addr, tableinstance);

      moduleInstance.tableaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          instantiatedTables[node.name.value] = addr;
        }
      }
    },

    Memory({ node }: NodePath<Memory>) {
      // TODO(sven): implement exporting a Memory instance
      const memoryinstance = null;

      const addr = allocator.malloc(1 /* size of the memoryinstance struct */);
      allocator.set(addr, memoryinstance);

      moduleInstance.memaddrs.push(addr);

      if (node.id != null) {
        if (node.id.type === "Identifier") {
          instantiatedMemories[node.id.value] = addr;
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
        instantiatedImportedElements[`${node.module}_${node.name}`];

      if (node.descr.type === "FuncImportDescr") {
        if (typeof instantiatedFuncAddr === "undefined") {
          throw new CompileError(
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
      } else if (node.descr.type === "GlobalType") {
        const isMutable = node.descr.mutability === "var";

        // Validation: The mutability of globaltype must be const.
        if (isMutable === true) {
          throw new CompileError("Mutable globals cannot be imported");
        }
      } else {
        throw new Error("Unsupported import of type: " + node.descr.type);
      }
    }
  });

  traverse(n, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        // Referenced by its index in the module.funcaddrs
        if (node.descr.id.type === "NumberLiteral") {
          const index = node.descr.id.value;

          const funcinstaddr = moduleInstance.funcaddrs[index];

          if (funcinstaddr === undefined) {
            throw new CompileError("Unknown function");
          }

          const externalVal = {
            type: node.descr.type,
            addr: funcinstaddr
          };

          assertNotAlreadyExported(node.name);

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }

        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
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

          assertNotAlreadyExported(node.name);

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }
      }

      if (node.descr.type === "Global") {
        // Referenced by its index in the module.globaladdrs
        if (node.descr.id.type === "NumberLiteral") {
          const index = node.descr.id.value;

          const globalinstaddr = moduleInstance.globaladdrs[index];

          if (globalinstaddr === undefined) {
            throw new CompileError("Unknown global");
          }

          const globalinst = allocator.get(globalinstaddr);

          if (globalinst.mutability === "var") {
            throw new CompileError("Mutable globals cannot be exported");
          }

          const externalVal = {
            type: node.descr.type,
            addr: globalinstaddr
          };

          assertNotAlreadyExported(node.name);

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

          assertNotAlreadyExported(node.name);

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }
      }

      if (node.descr.type === "Table") {
        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
          const instantiatedTable = instantiatedTables[node.descr.id.value];

          const externalVal = {
            type: node.descr.type,
            addr: instantiatedTable
          };

          assertNotAlreadyExported(node.name);

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }

        // Referenced by its index in the module.tableaddrs
        if (node.descr.id.type === "NumberLiteral") {
          const index = node.descr.id.value;

          const tableinstaddr = moduleInstance.tableaddrs[index];

          const externalVal = {
            type: node.descr.type,
            addr: tableinstaddr
          };

          assertNotAlreadyExported(node.name);

          if (tableinstaddr === undefined) {
            throw new CompileError("Unknown table");
          }

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }
      }

      if (node.descr.type === "Memory") {
        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
          const instantiatedMemory = instantiatedMemories[node.descr.id.value];

          const externalVal = {
            type: node.descr.type,
            addr: instantiatedMemory
          };

          assertNotAlreadyExported(node.name);

          moduleInstance.exports.push(
            createModuleExportIntance(node.name, externalVal)
          );
        }

        // Referenced by its index in the module.memaddrs
        if (node.descr.id.type === "NumberLiteral") {
          const index = node.descr.id.value;

          const meminstaddr = moduleInstance.memaddrs[index];

          const externalVal = {
            type: node.descr.type,
            addr: meminstaddr
          };

          assertNotAlreadyExported(node.name);

          if (meminstaddr === undefined) {
            throw new CompileError("Unknown memory");
          }

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
