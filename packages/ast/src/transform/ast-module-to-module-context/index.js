// @flow

import { isSignature, isNumberLiteral } from "../../nodes.js";
import { assert } from "mamacro";

export function moduleContextFromModuleAST(m: Module): any {
  const moduleContext = new ModuleContext();

  assert(m.type === "Module");

  m.fields.forEach((field) => {
    switch (field.type) {
      case "Start": {
        moduleContext.setStart(field.index);
        break;
      }
      case "TypeInstruction": {
        moduleContext.addType(field);
        break;
      }
      case "Func": {
        moduleContext.addFunction(field);
        break;
      }
      case "Global": {
        moduleContext.defineGlobal(field);
        break;
      }
      case "ModuleImport": {
        switch (field.descr.type) {
          case "GlobalType": {
            moduleContext.importGlobal(
              field.descr.valtype,
              field.descr.mutability
            );
            break;
          }
          case "Memory": {
            moduleContext.addMemory(
              field.descr.limits.min,
              field.descr.limits.max
            );
            break;
          }
          case "FuncImportDescr": {
            moduleContext.importFunction(field.descr);
            break;
          }

          case "Table": {
            // FIXME(sven): not implemented yet
            break;
          }

          default:
            throw new Error(
              "Unsupported ModuleImport of type " +
                JSON.stringify(field.descr.type)
            );
        }
        break;
      }
      case "Memory": {
        moduleContext.addMemory(field.limits.min, field.limits.max);
        break;
      }
    }
  });

  return moduleContext;
}

/**
 * Module context for type checking
 */
export class ModuleContext {
  funcs: Array<any>;
  funcsOffsetByIdentifier: Array<any>;
  types: Array<any>;
  globals: Array<any>;
  globalsOffsetByIdentifier: Array<any>;
  mems: Array<any>;
  locals: Array<any>;
  labels: Array<any>;
  return: Array<any>;
  debugName: string;
  start: any;

  constructor() {
    this.funcs = [];
    this.funcsOffsetByIdentifier = [];

    this.types = [];

    this.globals = [];
    this.globalsOffsetByIdentifier = [];

    this.mems = [];

    // Current stack frame
    this.locals = [];
    this.labels = [];
    this.return = [];

    this.debugName = "unknown";

    this.start = null;
  }

  /**
   * Set start segment
   */
  setStart(index: any) {
    this.start = index.value;
  }

  /**
   * Get start function
   */
  getStart(): any {
    return this.start;
  }

  /**
   * Reset the active stack frame
   */
  newContext(debugName: string, expectedResult: any) {
    this.locals = [];
    this.labels = [expectedResult];
    this.return = expectedResult;
    this.debugName = debugName;
  }

  /**
   * Functions
   */
  addFunction(func: Func) {
    /* eslint-disable */
    // $FlowIgnore
    let { params: args = [], results: result = [] } = func.signature || {};
    /* eslint-enable */

    args = args.map((arg) => arg.valtype);

    this.funcs.push({ args, result });

    if (typeof func.name !== "undefined") {
      // $FlowIgnore
      this.funcsOffsetByIdentifier[func.name.value] = this.funcs.length - 1;
    }
  }

  importFunction(funcimport: any) {
    if (isSignature(funcimport.signature)) {
      // eslint-disable-next-line prefer-const
      let { params: args, results: result } = funcimport.signature;
      args = args.map((arg) => arg.valtype);

      this.funcs.push({ args, result });
    } else {
      assert(isNumberLiteral(funcimport.signature));

      const typeId = funcimport.signature.value;
      assert(this.hasType(typeId));

      const signature = this.getType(typeId);
      this.funcs.push({
        args: signature.params.map((arg) => arg.valtype),
        result: signature.results,
      });
    }

    if (typeof funcimport.id !== "undefined") {
      // imports are first, we can assume their index in the array
      this.funcsOffsetByIdentifier[funcimport.id.value] = this.funcs.length - 1;
    }
  }

  hasFunction(index: any): boolean {
    return typeof this.getFunction(index) !== "undefined";
  }

  getFunction(index: any): any {
    if (typeof index !== "number") {
      throw new Error("getFunction only supported for number index");
    }

    return this.funcs[index];
  }

  getFunctionOffsetByIdentifier(name: any): any {
    assert(typeof name === "string");
    return this.funcsOffsetByIdentifier[name];
  }

  /**
   * Labels
   */
  addLabel(result: any) {
    this.labels.unshift(result);
  }

  hasLabel(index: any): boolean {
    return this.labels.length > index && index >= 0;
  }

  getLabel(index: any): any {
    return this.labels[index];
  }

  popLabel() {
    this.labels.shift();
  }

  /**
   * Locals
   */
  hasLocal(index: any): boolean {
    return typeof this.getLocal(index) !== "undefined";
  }

  getLocal(index: any): any {
    return this.locals[index];
  }

  addLocal(type: any) {
    this.locals.push(type);
  }

  /**
   * Types
   */
  addType(type: any) {
    assert(type.functype.type === "Signature");
    this.types.push(type.functype);
  }

  hasType(index: any): boolean {
    return this.types[index] !== undefined;
  }

  getType(index: any): any {
    return this.types[index];
  }

  /**
   * Globals
   */
  hasGlobal(index: any): boolean {
    return this.globals.length > index && index >= 0;
  }

  getGlobal(index: any): any {
    return this.globals[index].type;
  }

  getGlobalOffsetByIdentifier(name: string): any {
    assert(typeof name === "string");
    // $FlowIgnore
    return this.globalsOffsetByIdentifier[name];
  }

  defineGlobal(global: Global) {
    const type = global.globalType.valtype;
    const mutability = global.globalType.mutability;

    this.globals.push({ type, mutability });

    if (typeof global.name !== "undefined") {
      // $FlowIgnore
      this.globalsOffsetByIdentifier[global.name.value] =
        this.globals.length - 1;
    }
  }

  importGlobal(type: any, mutability: any) {
    this.globals.push({ type, mutability });
  }

  isMutableGlobal(index: any): any {
    return this.globals[index].mutability === "var";
  }

  isImmutableGlobal(index: any): any {
    return this.globals[index].mutability === "const";
  }

  /**
   * Memories
   */
  hasMemory(index: any): boolean {
    return this.mems.length > index && index >= 0;
  }

  addMemory(min: any, max: any) {
    this.mems.push({ min, max });
  }

  getMemory(index: any): any {
    return this.mems[index];
  }
}
