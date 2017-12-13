// @flow

const {traverse} = require('../compiler/AST/traverse');
const modulevalue = require('./runtime/values/module');
const {executeStackFrame} = require('./kernel/exec');
const {createStackFrame} = require('./kernel/stackframe');
const {isTrapped} = require('./kernel/signals');
const {RuntimeError} = require('../errors');
const {Module} = require('../compiler/compile/module');
const {Memory} = require('./runtime/values/memory');
const {createAllocator} = require('./kernel/memory');

const DEFAULT_MEMORY = new Memory({initial: 1, maximum: 1024});

export class Instance {
  exports: any;

  _allocator: Allocator;
  _moduleInstance: ModuleInstance;
  _table: ?TableInstance;

  constructor(module: Module, importObject: ImportObject) {

    if (module instanceof Module === false) {

      throw new Error(
        'module must be of type WebAssembly.Module, '
        + (typeof module) + ' given.'
      );
    }

    this.exports = {};

    /**
     * Create Module's memory allocator
     */
    this._allocator = createAllocator(DEFAULT_MEMORY);

    /**
     * Use importObject:
     *
     * - Table if provided
     * - Memory if provided
     */
    if (typeof importObject.js === 'object') {

      if (typeof importObject.js.tbl === 'object') {
        this._table = importObject.js.tbl;
      }
    }

    const ast = module._ast;
    const moduleAst = getModuleFromProgram(ast);

    if (typeof moduleAst === 'undefined') {
      throw new Error('Module not found');
    }

    const moduleInstance = modulevalue.createInstance(this._allocator, moduleAst);

    moduleInstance.exports.forEach((exportinst) => {

      this.exports[exportinst.name] = createHostfunc(
        moduleInstance,
        exportinst,
        this._allocator,
      );

      if (this._table != undefined) {

        this._table.push(
          this.exports[exportinst.name]
        );
      }

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

function createHostfunc(
  moduleinst: ModuleInstance,
  exportinst: ExportInstance,
  allocator: Allocator,
): Hostfunc {

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

    const funcinst = allocator.get(exportinstAddr);

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

    const stackFrame = createStackFrame(
      funcinst.code,
      argsWithType,
      funcinst.module,
      allocator,
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
      throw new RuntimeError('Execution has been trapped');
    }

    if (typeof res !== 'undefined') {
      return res.value;
    }
  };
}
