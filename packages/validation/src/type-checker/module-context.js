/**
 * Module context for type checking
 */
export default class ModuleContext {
  constructor() {
    this.funcs = [];
    this.globals = [];
    this.mems = [];

    // Current stack frame
    this.locals = [];
    this.labels = [];
  }

  resetStackFrame(expectedResult) {
    this.locals = [];
    this.labels = [expectedResult];
  }

  /**
   * Functions
   */
  addFunction({ params: args, results: result }) {
    args = args.map(arg => arg.valtype);
    this.funcs.push({ args, result });
  }

  hasFunction(index) {
    return this.funcs.length > index && index >= 0;
  }

  getFunction(index) {
    return this.funcs[index];
  }

  /**
   * Labels
   */
  addLabel(result) {
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
    return this.locals.length > index && index >= 0;
  }

  getLocal(index) {
    return this.locals[index];
  }

  addLocal(type) {
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
