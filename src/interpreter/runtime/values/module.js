// @flow
import { Memory } from "./memory";
import { RuntimeError } from "../../../errors";

const { traverse } = require("../../../compiler/AST/traverse");
const func = require("./func");
const externvalue = require("./extern");
const global = require("./global");
const { LinkError, CompileError } = require("../../../errors");

/**
 * Create Module's import instances
 *
 * > the indices of imports go before the first index of any definition
 * > contained in the module itself.
 * see https://webassembly.github.io/spec/core/syntax/modules.html#imports
 */
function instantiateImports(
  n: Module,
  allocator: Allocator,
  externalElements: Object,
  internals: Object,
  moduleInstance: ModuleInstance
) {
  function getExternalElementOrThrow(key: string, key2: string): any {
    if (
      typeof externalElements[key] === "undefined" ||
      typeof externalElements[key][key2] === "undefined"
    ) {
      throw new CompileError(`Unknown import ${key}.${key2}`);
    }

    return externalElements[key][key2];
  }

  function handleFuncImport(node: ModuleImport) {
    const element = getExternalElementOrThrow(node.module, node.name);
    const descr: FuncImportDescr = node.descr;

    const params = descr.params != null ? descr.params : [];
    const results = descr.results != null ? descr.results : [];

    const externFuncinstance = externvalue.createFuncInstance(
      element,
      params,
      results
    );

    const externFuncinstanceAddr = allocator.malloc(
      1 /* sizeof externFuncinstance */
    );
    allocator.set(externFuncinstanceAddr, externFuncinstance);

    moduleInstance.funcaddrs.push(externFuncinstanceAddr);
  }

  function handleGlobalImport(node: ModuleImport) {
    const element = getExternalElementOrThrow(node.module, node.name);
    const descr: GlobalType = node.descr;
    const isMutable = descr.mutability === "var";

    // Validation: The mutability of globaltype must be const.
    if (isMutable === true) {
      throw new CompileError("Mutable globals cannot be imported");
    }

    const externglobalinstance = externvalue.createGlobalInstance(
      element,
      descr.valtype,
      descr.mutability
    );

    const addr = allocator.malloc(1 /* size of the globalinstance struct */);
    allocator.set(addr, externglobalinstance);

    moduleInstance.globaladdrs.push(addr);
  }

  traverse(n, {
    ModuleImport({ node }: NodePath<ModuleImport>) {
      switch (node.descr.type) {
        case "FuncImportDescr":
          return handleFuncImport(node);
        case "GlobalType":
          return handleGlobalImport(node);
        default:
          throw new Error("Unsupported import of type: " + node.descr.type);
      }
    }
  });
}

/**
 * Create Module's internal elements instances
 */
function instantiateInternals(
  n: Module,
  allocator: Allocator,
  internals: Object,
  moduleInstance: ModuleInstance
) {
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
          internals.instantiatedFuncs[node.name.value] = addr;
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
          internals.instantiatedTables[node.name.value] = addr;
        }
      }
    },

    Memory({ node }: NodePath<Memory>) {
      const limits = node.limits;

      if (limits.max && limits.max < limits.min) {
        throw new RuntimeError("size minimum must not be greater than maximum");
      }

      if (limits.min > 65536) {
        throw new RuntimeError(
          "memory size must be at most 65536 pages (4GiB)"
        );
      }

      const memoryDescriptor = {
        initial: limits.min,
        maximum: limits.max
      };
      const memoryinstance = new Memory(memoryDescriptor);

      const addr = allocator.malloc(1 /* size of the memoryinstance struct */);
      allocator.set(addr, memoryinstance);

      moduleInstance.memaddrs.push(addr);

      if (node.id != null) {
        if (node.id.type === "Identifier") {
          internals.instantiatedMemories[node.id.value] = addr;
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
          internals.instantiatedGlobals[node.name.value] = {
            addr,
            type: node.globalType
          };
        }
      }
    }
  });
}

/**
 * Create Module's exports instances
 *
 * The `internals` argument reference already instantiated elements
 */
function instantiateExports(
  n: Module,
  allocator: Allocator,
  internals: Object,
  moduleInstance: ModuleInstance
) {
  function assertNotAlreadyExported(str) {
    const moduleInstanceExport = moduleInstance.exports.find(
      ({ name }) => name === str
    );

    if (moduleInstanceExport !== undefined) {
      throw new CompileError("Duplicate export name");
    }
  }

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
          const instantiatedFuncAddr =
            internals.instantiatedFuncs[node.descr.id.value];

          if (typeof instantiatedFuncAddr === "undefined") {
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
          const instantiatedGlobal =
            internals.instantiatedGlobals[node.descr.id.value];

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
          const instantiatedTable =
            internals.instantiatedTables[node.descr.id.value];

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
          const instantiatedMemory =
            internals.instantiatedMemories[node.descr.id.value];

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
}

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
  const instantiatedInternals = {
    instantiatedFuncs: {},
    instantiatedGlobals: {},
    instantiatedTables: {},
    instantiatedMemories: {}
  };

  instantiateImports(
    n,
    allocator,
    externalElements,
    instantiatedInternals,
    moduleInstance
  );

  instantiateInternals(n, allocator, instantiatedInternals, moduleInstance);

  instantiateExports(n, allocator, instantiatedInternals, moduleInstance);

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
