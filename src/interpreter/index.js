// @flow

const {
  castIntoStackLocalOfType
} = require("./runtime/castIntoStackLocalOfType");
const { traverse } = require("../compiler/AST/traverse");
const modulevalue = require("./runtime/values/module");
const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const { isTrapped } = require("./kernel/signals");
const { RuntimeError } = require("../errors");
const { Module } = require("../compiler/compile/module");
const { Memory } = require("./runtime/values/memory");
const { Table } = require("./runtime/values/table");
const { createAllocator } = require("./kernel/memory");
const importObjectUtils = require("./import-object");

const ALLOCATOR_MEMORY = new Memory({ initial: 1, maximum: 1024 });

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
    this._allocator = createAllocator(ALLOCATOR_MEMORY);

    /**
     * importObject.
     */
    if (typeof importObject === "object") {
      importObjectUtils.walk(importObject, (key, key2, value) => {
        if (typeof this._externalFunctions[key] !== "object") {
          this._externalFunctions[key] = {};
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
          this._allocator
        );
      }

      if (exportinst.value.type === "Global") {
        const globalinst = this._allocator.get(exportinst.value.addr);

        if (globalinst == null) {
          throw new RuntimeError("Global instance has not been instantiated");
        }

        this.exports[exportinst.name] = globalinst.value.toNumber();
      }

      if (exportinst.value.type === "Memory") {
        const memoryinst = this._allocator.get(exportinst.value.addr);

        if (memoryinst == null) {
          throw new RuntimeError("Memory instance has not been instantiated");
        }

        this.exports[exportinst.name] = memoryinst;
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

function createHostfunc(
  moduleinst: ModuleInstance,
  exportinst: ExportInstance,
  allocator: Allocator
): Hostfunc {
  return function hostfunc(...args): ?any {
    const exportinstAddr = exportinst.value.addr;

    /**
     * Find callable in instantiated function in the module funcaddrs
     */
    const hasModuleInstantiatedFunc = moduleinst.funcaddrs.indexOf(
      exportinstAddr
    );

    if (hasModuleInstantiatedFunc === -1) {
      throw new RuntimeError(
        `Function at addr ${
          exportinstAddr.index
        } has not been initialized in the module.` +
          "Probably an internal failure"
      );
    }

    const funcinst = allocator.get(exportinstAddr);

    if (funcinst === null) {
      throw new RuntimeError(
        `Function was not found at addr ${exportinstAddr.index}`
      );
    }

    const funcinstArgs = funcinst.type[0];
    const funcinstResults = funcinst.type[1];

    /**
     * If the signature contains an i64 (as argument or result), the host
     * function immediately throws a TypeError when called.
     */
    const funcinstArgsHasi64 = funcinstArgs.indexOf("i64") !== -1;
    const funcinstResultsHasi64 = funcinstResults.indexOf("i64") !== -1;

    if (funcinstArgsHasi64 === true || funcinstResultsHasi64 === true) {
      throw new TypeError(
        "Can not call this function from JavaScript: " + "i64 in signature."
      );
    }

    /**
     * Check number of argument passed vs the function arity
     */
    if (args.length !== funcinstArgs.length) {
      throw new RuntimeError(
        `Function ${exportinstAddr.index} called with ${
          args.length
        } arguments but ` +
          funcinst.type[0].length +
          " expected"
      );
    }

    const argsWithType = args.map((value: any, i: number): StackLocal =>
      castIntoStackLocalOfType(funcinstArgs[i], value)
    );

    const stackFrame = createStackFrame(
      funcinst.code,
      argsWithType,
      funcinst.module,
      allocator
    );

    // stackFrame.trace = (depth, pc, i) => console.log(
    //   'trace exec',
    //   'depth:' + depth,
    //   'pc:' + pc,
    //   'instruction:' + i.type,
    //   'v:' + i.id,
    // );

    const res = executeStackFrame(stackFrame);

    if (isTrapped(res)) {
      throw new RuntimeError("Execution has been trapped");
    }

    if (res != null && res.value != null) {
      return res.value.toNumber();
    }
  };
}
