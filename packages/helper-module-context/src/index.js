// TODO(sven): add flow in here

const debug = require("debug")("webassemblyjs:modulecontext");

export function moduleContextFromModuleAST(m) {
  const moduleContext = new ModuleContext();

  m.fields.forEach(field => {
    switch (field.type) {
      case "Func": {
        moduleContext.addFunction(field.signature);
        break;
      }
      case "Global": {
        moduleContext.defineGlobal(field.globalType.valtype, field.mutability);
        break;
      }
      case "ModuleImport": {
        switch (field.descr.type) {
          case "GlobalType": {
            moduleContext.importGlobal(field.descr.valtype);
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
            moduleContext.importFunction(field.descr.signature);
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
  constructor() {
    this.funcs = [];
    this.globals = [];
    this.mems = [];

    // Current stack frame
    this.locals = [];
    this.labels = [];
    this.return = [];

    this.debugName = "unknown";
  }

  /**
   * Reset the active stack frame
   */
  newContext(debugName, expectedResult) {
    debug("new context %s", debugName);

    this.locals = [];
    this.labels = [expectedResult];
    this.return = expectedResult;
    this.debugName = debugName;
  }

  /**
   * Functions
   */
  addFunction({ params: args = [], results: result = [] }) {
    args = args.map(arg => arg.valtype);

    debug("add new function %s -> %s", args.join(" "), result.join(" "));

    this.funcs.push({ args, result });
  }

  importFunction({ params: args, results: result }) {
    args = args.map(arg => arg.valtype);

    debug(
      "add new imported function %s -> %s",
      args.join(" "),
      result.join(" ")
    );

    this.funcs.unshift({ args, result });
  }

  hasFunction(index) {
    return typeof this.getFunction(index) !== "undefined";
  }

  getFunction(index) {
    if (typeof index !== "number") {
      throw new Error("getFunction only supported for number index");
    }

    return this.funcs[index];
  }

  /**
   * Labels
   */
  addLabel(result) {
    debug("add label");

    this.labels.unshift(result);
  }

  hasLabel(index) {
    return this.labels.length > index && index >= 0;
  }

  getLabel(index) {
    return this.labels[index];
  }

  popLabel() {
    this.labels.shift();
  }

  /**
   * Locals
   */
  hasLocal(index) {
    return typeof this.getLocal(index) !== "undefined";
  }

  getLocal(index) {
    return this.locals[index];
  }

  addLocal(type) {
    debug("add local t=%s index=%d", type, this.locals.length);

    this.locals.push(type);
  }

  /**
   * Globals
   */
  hasGlobal(index) {
    return this.globals.length > index && index >= 0;
  }

  getGlobal(index) {
    return this.globals[index].type;
  }

  defineGlobal(type, mutability) {
    this.globals.push({ type, mutability });
  }

  importGlobal(type, mutability) {
    this.globals.unshift({ type, mutability });
  }

  isMutableGlobal(index) {
    return this.globals[index].mutability === "var";
  }

  /**
   * Memories
   */
  hasMemory(index) {
    return this.mems.length > index && index >= 0;
  }

  addMemory(min, max) {
    this.mems.push({ min, max });
  }

  getMemory(index) {
    return this.mems[index];
  }
}
