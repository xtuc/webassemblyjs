// @flow

const { traverse } = require("../compiler/AST/traverse");
const modulevalue = require("./runtime/values/module");
const { RuntimeError } = require("../errors");
const { Module } = require("../compiler/compile/module");
const { Memory } = require("./runtime/values/memory");
const { Table } = require("./runtime/values/table");
const { createAllocator } = require("./kernel/memory");
const importObjectUtils = require("./import-object");
import { createHostfunc } from "./host-func";

const DEFAULT_MEMORY = new Memory({ initial: 1, maximum: 1024 });

export class Instance {
  exports: any;

  _allocator: Allocator;
  _moduleInstance: ModuleInstance;
  _table: ?TableInstance;

  /**
   * Map id to external callable functions
   */
  _externalFunctions: any;

  constructor(module: CompiledModule, importObject: ImportObject) {
    if (module instanceof Module === false) {
      throw new TypeError(
        "module must be of type WebAssembly.Module, " +
          typeof module +
          " given."
      );
    }

    this._externalFunctions = {};
    this.exports = {};

    /**
     * Create Module's default memory allocator
     */
    this._allocator = createAllocator(DEFAULT_MEMORY);

    /**
     * Pass internal options
     */
    let internalInstanceOptions: InternalInstanceOptions = {
      checkForI64InSignature: true
    };

    if (typeof importObject._internalInstanceOptions === "object") {
      internalInstanceOptions = importObject._internalInstanceOptions;
    }

    /**
     * importObject.
     */
    if (typeof importObject === "object") {
      importObjectUtils.walk(importObject, (key, key2, value) => {
        if (typeof this._externalFunctions[key] !== "object") {
          this._externalFunctions[key] = {};
        }

        if (value instanceof Memory) {
          this._allocator = createAllocator(value);
        }

        if (value instanceof Table) {
          this._table = value;
        }

        if (typeof value === "function") {
          this._externalFunctions[key][key2] = value;
        }
      });
    }

    const moduleNode = getModuleFromProgram(module._ast);

    if (moduleNode === null) {
      throw new RuntimeError("Module not found");
    }

    const moduleInstance = modulevalue.createInstance(
      this._allocator,

      // $FlowIgnore: that's the correct type but Flow fails to get it
      moduleNode,

      this._externalFunctions
    );

    moduleInstance.exports.forEach(exportinst => {
      if (exportinst.value.type === "Func") {
        this.exports[exportinst.name] = createHostfunc(
          moduleInstance,
          exportinst,
          this._allocator,
          internalInstanceOptions
        );
      }

      if (exportinst.value.type === "Global") {
        const globalinst = this._allocator.get(exportinst.value.addr);

        if (globalinst == null) {
          throw new RuntimeError("Global instance has not been instantiated");
        }

        this.exports[exportinst.name] = globalinst.value.toNumber();
      }

      if (this._table != undefined) {
        this._table.push(this.exports[exportinst.name]);
      }
    });

    this._moduleInstance = moduleInstance;
  }
}

function getModuleFromProgram(ast: Program): ?Module {
  let module = null;

  traverse(ast, {
    Module({ node }: NodePath<Module>) {
      module = node;
    }
  });

  return module;
}
