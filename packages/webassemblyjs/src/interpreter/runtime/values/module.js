// @flow

import { traverse } from "@webassemblyjs/ast";
import * as WebAssemblyMemory from "./memory";

const { RuntimeError, LinkError, CompileError } = require("../../../errors");
const WebAssemblyTable = require("./table");
const func = require("./func");
const externvalue = require("./extern");
const global = require("./global");
const { i32 } = require("./i32");

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

  function handleFuncImport(node: ModuleImport, descr: FuncImportDescr) {
    const element = getExternalElementOrThrow(node.module, node.name);

    const params = descr.signature.params != null ? descr.signature.params : [];
    const results =
      descr.signature.results != null ? descr.signature.results : [];

    const externFuncinstance = externvalue.createFuncInstance(
      element,
      // $FlowIgnore
      params,
      results
    );

    const externFuncinstanceAddr = allocator.malloc(
      1 /* sizeof externFuncinstance */
    );
    allocator.set(externFuncinstanceAddr, externFuncinstance);

    moduleInstance.funcaddrs.push(externFuncinstanceAddr);
  }

  function handleGlobalImport(node: ModuleImport, descr: GlobalType) {
    // Validation: The mutability of globaltype must be const.
    if (descr.mutability === "var") {
      throw new CompileError("Mutable globals cannot be imported");
    }

    const element = getExternalElementOrThrow(node.module, node.name);

    const externglobalinstance = externvalue.createGlobalInstance(
      new i32(element),
      descr.valtype,
      descr.mutability
    );

    const addr = allocator.malloc(1 /* size of the globalinstance struct */);
    allocator.set(addr, externglobalinstance);

    moduleInstance.globaladdrs.push(addr);
  }

  function handleMemoryImport(node: ModuleImport) {
    const memoryinstance = getExternalElementOrThrow(node.module, node.name);

    const addr = allocator.malloc(1 /* size of the memoryinstance struct */);
    allocator.set(addr, memoryinstance);

    moduleInstance.memaddrs.push(addr);
  }

  function handleTableImport(node: ModuleImport) {
    const tableinstance = getExternalElementOrThrow(node.module, node.name);

    const addr = allocator.malloc(1 /* size of the tableinstance struct */);
    allocator.set(addr, tableinstance);

    moduleInstance.tableaddrs.push(addr);
  }

  traverse(n, {
    ModuleImport({ node }: NodePath<ModuleImport>) {
      switch (node.descr.type) {
        case "FuncImportDescr":
          return handleFuncImport(node, node.descr);
        case "GlobalType":
          return handleGlobalImport(node, node.descr);
        case "Memory":
          return handleMemoryImport(node);
        case "Table":
          return handleTableImport(node);
        default:
          throw new Error("Unsupported import of type: " + node.descr.type);
      }
    }
  });
}

/**
 * write data segments to linear memory
 */
function instantiateDataSections(
  n: Module,
  allocator: Allocator,
  moduleInstance: ModuleInstance
) {
  traverse(n, {
    Data({ node }: NodePath<Data>) {
      const memIndex = node.memoryIndex.value;
      const memoryAddr = moduleInstance.memaddrs[memIndex];
      const memory = allocator.get(memoryAddr);
      const buffer = new Uint8Array(memory.buffer);

      let offset: number;
      if (node.offset.id === "const") {
        const offsetInstruction: any = node.offset;
        const arg = (offsetInstruction.args[0]: any);
        offset = arg.value;
      } else if (node.offset.id === "get_global") {
        const offsetInstruction: any = node.offset;
        const globalIndex = (offsetInstruction.args[0]: any).value;
        const globalAddr = moduleInstance.globaladdrs[globalIndex];
        const globalInstance = allocator.get(globalAddr);
        offset = globalInstance.value.toNumber();
      } else {
        throw new RuntimeError(
          "data segment offsets can only be specified as constants or globals"
        );
      }

      for (let i = 0; i < node.init.values.length; i++) {
        buffer[i + offset] = node.init.values[i];
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
          internals.instantiatedFuncs[node.name.value] = { addr };
        }
      }
    },

    Table({ node }: NodePath<Table>) {
      const initial = node.limits.min;
      const element = node.elementType;

      const tableinstance = new WebAssemblyTable.Table({ initial, element });

      const addr = allocator.malloc(1 /* size of the tableinstance struct */);
      allocator.set(addr, tableinstance);

      moduleInstance.tableaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          internals.instantiatedTables[node.name.value] = { addr };
        }
      }
    },

    Elem({ node }: NodePath<Elem>) {
      let table;

      if (node.table.type === "NumberLiteral") {
        const addr = moduleInstance.tableaddrs[node.table.value];
        table = allocator.get(addr);
      }

      if (typeof table === "object") {
        // FIXME(sven): expose the function in a HostFunc
        table.push(function() {
          throw new Error("Unsupported operation");
        });
      } else {
        throw new CompileError("Unknown table");
      }
    },

    Memory({ node }: NodePath<Memory>) {
      // Module has already a memory instance (likely imported), skip this.
      if (moduleInstance.memaddrs.length !== 0) {
        return;
      }

      const { min, max } = node.limits;

      const memoryDescriptor: MemoryDescriptor = {
        initial: min
      };

      if (typeof max === "number") {
        memoryDescriptor.maximum = max;
      }

      const memoryinstance = new WebAssemblyMemory.Memory(memoryDescriptor);

      const addr = allocator.malloc(1 /* size of the memoryinstance struct */);
      allocator.set(addr, memoryinstance);

      moduleInstance.memaddrs.push(addr);

      if (node.id != null) {
        if (node.id.type === "Identifier") {
          // $FlowIgnore
          internals.instantiatedMemories[node.id.value] = { addr };
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

  function createModuleExport(
    node: ModuleExport,
    instantiatedItemArray,
    validate: Object => void
  ) {
    if (node.descr.id.type === "Identifier") {
      const instantiatedItem = instantiatedItemArray[node.descr.id.value];

      validate(instantiatedItem);

      assertNotAlreadyExported(node.name);

      moduleInstance.exports.push({
        name: node.name,
        value: {
          type: node.descr.type,
          addr: instantiatedItem.addr
        }
      });
    } else {
      throw new CompileError(
        "Module exports must be referenced via an Identifier"
      );
    }
  }

  traverse(n, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      switch (node.descr.type) {
        case "Func": {
          createModuleExport(
            node,
            internals.instantiatedFuncs,
            instantiatedFunc => {
              if (typeof instantiatedFunc === "undefined") {
                throw new Error("unknown function");
              }
            }
          );
          break;
        }
        case "Global": {
          createModuleExport(
            node,
            internals.instantiatedGlobals,
            instantiatedGlobal => {
              if (typeof instantiatedGlobal === "undefined") {
                throw new Error("unknown global");
              } else if (instantiatedGlobal.type.mutability === "var") {
                throw new CompileError("Mutable globals cannot be exported");
              } else if (instantiatedGlobal.type.valtype === "i64") {
                throw new LinkError(
                  "Export of globals of type i64 is not allowed"
                );
              }
            }
          );
          break;
        }
        case "Table": {
          createModuleExport(
            node,
            internals.instantiatedTables,
            instantiatedTable => {
              if (typeof instantiatedTable === "undefined") {
                throw new Error("unknown table");
              }
            }
          );
          break;
        }
        case "Memory": {
          createModuleExport(
            node,
            internals.instantiatedMemories,
            instantiatedMemory => {
              if (typeof instantiatedMemory === "undefined") {
                throw new Error("unknown memory");
              }
            }
          );
          break;
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

  instantiateDataSections(n, allocator, moduleInstance);

  instantiateExports(n, allocator, instantiatedInternals, moduleInstance);

  return moduleInstance;
}
