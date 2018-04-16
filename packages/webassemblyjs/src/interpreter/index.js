// @flow

import { traverse } from "@webassemblyjs/ast";

import { Module } from "../compiler/compile/module";
import { RuntimeError } from "../errors";
const modulevalue = require("./runtime/values/module");
const { createAllocator } = require("./kernel/memory");
const importObjectUtils = require("./import-object");
import { createHostfunc, executeStackFrameAndGetResult } from "./host-func";
const { createStackFrame } = require("./kernel/stackframe");

export class Instance {
  exports: any;

  _allocator: Allocator;
  _moduleInstance: ModuleInstance;

  /**
   * Map id to external elements or callable functions
   */
  _externalElements: any;

  constructor(module: CompiledModule, importObject: ImportObject) {
    if (module instanceof Module === false) {
      throw new TypeError(
        "module must be of type WebAssembly.Module, " +
          typeof module +
          " given."
      );
    }

    this._externalElements = {};
    this.exports = {};

    /**
     * Create Module's default memory allocator
     */
    this._allocator = createAllocator();

    /**
     * Pass internal options
     */
    let internalInstanceOptions: InternalInstanceOptions = {
      checkForI64InSignature: true,
      returnStackLocal: false
    };

    if (typeof importObject._internalInstanceOptions === "object") {
      internalInstanceOptions = importObject._internalInstanceOptions;
    }

    /**
     * importObject.
     */
    if (typeof importObject === "object") {
      importObjectUtils.walk(importObject, (key, key2, value) => {
        if (typeof this._externalElements[key] !== "object") {
          this._externalElements[key] = {};
        }

        this._externalElements[key][key2] = value;
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

      this._externalElements
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

        if (internalInstanceOptions.returnStackLocal === true) {
          this.exports[exportinst.name] = globalinst;
        } else {
          this.exports[exportinst.name] = globalinst.value.toNumber();
        }
      }

      if (exportinst.value.type === "Memory") {
        const memoryinst = this._allocator.get(exportinst.value.addr);

        if (memoryinst == null) {
          throw new RuntimeError("Memory instance has not been instantiated");
        }

        this.exports[exportinst.name] = memoryinst;
      }
    });

    this._moduleInstance = moduleInstance;

    if (module._start != null && module._start.type === "NumberLiteral") {
      // $FlowIgnore: the NumberLiteral type ensure that the value is present
      const value = module._start.value;
      this.executeStartFunc(value);
    }
  }

  executeStartFunc(value: number) {
    const funcinstAddr = this._moduleInstance.funcaddrs[value];

    if (typeof funcinstAddr === "undefined") {
      throw new RuntimeError("Start function not found, index: " + value);
    }

    const funcinst = this._allocator.get(funcinstAddr);

    // The type of C.funcs[x] must be []→[].
    const [params, results] = funcinst.type;

    if (params.length !== 0 || results.length !== 0) {
      throw new RuntimeError(
        "Start function can not have arguments or results"
      );
    }

    const stackFrame = createStackFrame(
      funcinst.code,
      params,
      funcinst.module,
      this._allocator
    );

    // Ignore the result
    executeStackFrameAndGetResult(stackFrame, /* returnStackLocal */ true);
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
