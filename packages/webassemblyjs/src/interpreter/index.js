// @flow

import { traverse } from "@webassemblyjs/ast";

import { Module } from "../compiler/compile/module";
import { RuntimeError } from "../errors";
const modulevalue = require("./runtime/values/module");
const { createAllocator } = require("./kernel/memory");
const importObjectUtils = require("./import-object");
import { createHostfunc, executeStackFrameAndGetResult } from "./host-func";
const { createStackFrame } = require("./kernel/stackframe");
import { kStart } from "@webassemblyjs/helper-compiler";

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
      module._ir.funcTable,

      this._allocator,

      // $FlowIgnore: that's the correct type but Flow fails to get it
      moduleNode,

      this._externalElements
    );

    moduleInstance.exports.forEach(exportinst => {
      if (exportinst.value.type === "Func") {
        this.exports[exportinst.name] = createHostfunc(
          module._ir,
          moduleInstance,
          exportinst,
          this._allocator,
          internalInstanceOptions
        );

        return;
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

        return;
      }

      if (exportinst.value.type === "Mem") {
        const memoryinst = this._allocator.get(exportinst.value.addr);

        if (memoryinst == null) {
          throw new RuntimeError("Memory instance has not been instantiated");
        }

        this.exports[exportinst.name] = memoryinst;

        return;
      }

      if (exportinst.value.type === "Table") {
        const tableinst = this._allocator.get(exportinst.value.addr);

        if (tableinst == null) {
          throw new RuntimeError("Table instance has not been instantiated");
        }

        this.exports[exportinst.name] = tableinst;

        return;
      }

      throw new Error("Unknown export type: " + exportinst.value.type);
    });

    this._moduleInstance = moduleInstance;

    const startFunc = module._ir.funcTable.find(x => x.name === kStart);

    if (startFunc != null) {
      this.executeStartFunc(module._ir, startFunc.startAt);
    }
  }

  executeStartFunc(ir: IR, offset: number) {
    // FIXME(sven): func params? do we need this here? it's a validation.
    const params = [];

    const stackFrame = createStackFrame(
      params,
      this._moduleInstance,
      this._allocator
    );

    // Ignore the result
    executeStackFrameAndGetResult(
      ir,
      offset,
      stackFrame,
      /* returnStackLocal */ true
    );
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
