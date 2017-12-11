// @flow

const {traverse} = require('../compiler/AST/traverse');
const modulevalue = require('./runtime/values/module');
const {get} = require('./kernel/memory');
const {executeStackFrame} = require('./kernel/exec');
const {createStackFrame} = require('./kernel/stackframe');
const {isTrapped} = require('./kernel/signals');
const {RuntimeError} = require('../errors');
const {Module} = require('../compiler/compile/module');

export class Instance {
  exports: any;

  _moduleInstance: ModuleInstance;

  constructor(module: Module, importObject?: any) {

    if (module instanceof Module === false) {

      throw new Error(
        'module must be of type WebAssembly.Module, '
        + (typeof module) + ' given.'
      );
    }

    this.exports = {};

    const ast = module._ast;
    const moduleAst = getModuleFromProgram(ast);

    if (typeof moduleAst === 'undefined') {
      throw new Error('Module not found');
    }

    const moduleInstance = modulevalue.createInstance(moduleAst);

    moduleInstance.exports.forEach((exportinst) => {
      this.exports[exportinst.name] = createHostfunc(moduleInstance, exportinst);
    });

    this._moduleInstance = moduleInstance;
  }
}

function getModuleFromProgram(ast: Program): ?Module {
  let module;

  traverse(ast, {

    Module({node}: NodePath<Module>) {
      module = node;
    }
  });

  return module;
}

function createHostfunc(moduleinst: ModuleInstance, exportinst: ExportInstance): Hostfunc {

  return function hostfunc(...args) {
    const exportinstAddr = exportinst.value.addr;

    /**
     * Find callable in instantiated function in the module funcaddrs
     */
    const hasModuleInstantiatedFunc = moduleinst.funcaddrs.indexOf(exportinstAddr);

    if (hasModuleInstantiatedFunc === -1) {
      throw new Error(
        `Function at addr ${exportinstAddr.index} has not been initialized in the module.` +
        'Probably an internal failure'
      );
    }

    const funcinst = get(exportinstAddr);

    if (funcinst === null) {
      throw new Error(`Function was not found at addr ${exportinstAddr.index}`);
    }

    /**
     * Check number of argument passed vs the function arity
     */
    const funcinstArgs = funcinst.type[0];
    if (args.length !== funcinstArgs.length) {
      throw new Error(
        'Function called with ' + args.length + ' arguments but '
        + funcinst.type[0].length + ' expected'
      );
    }

    const argsWithType = args.map((value: any, i: number): StackLocal => {
      const type = funcinstArgs[i];

      return {
        value,
        type,
      };
    });

    const stackFrame = createStackFrame(funcinst.code, argsWithType, funcinst.originatingModule);

    // stackFrame.trace = (depth, pc, i) => console.log('trace exec', pc, i);

    const res = executeStackFrame(stackFrame);

    if (isTrapped(res)) {
      throw new RuntimeError('Execution has been trapped');
    }

    if (typeof res !== 'undefined') {
      return res.value;
    }
  };
}
