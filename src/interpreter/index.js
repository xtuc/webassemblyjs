// @flow

const {traverse} = require('../compiler/AST/traverse');
const {createInstance} = require('./runtime/values/module');
const {get} = require('./kernel/memory');
const {executeStackFrame} = require('./kernel/exec');
const {createStackFrame} = require('./kernel/stackframe');

export function evaluateAst(ast: Node): UserlandModuleInstance {
  const exports = {};

  traverse(ast, {

    Module(path) {
      const node: Module = path.node;

      const instance = createInstance(node);

      instance.exports.forEach((exportinst) => {

        exports[exportinst.name] = function hostfunc(...args) {
          const exportinstAddr = exportinst.value.addr;

          /**
           * Find callable in instantiated function in the module funcaddrs
           */
          const hasModuleInstantiatedFunc = instance.funcaddrs.indexOf(exportinstAddr);

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

          const stackFrame = createStackFrame(funcinst.code, argsWithType);

          // stackFrame.trace = (pc, i) => console.log('trace exec', pc, i);

          const res = executeStackFrame(stackFrame);

          if (typeof res !== 'undefined') {
            return res.value;
          }
        };

      });
    }

  });

  return {
    exports,
  };
}
