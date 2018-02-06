// @flow

const {
  castIntoStackLocalOfType
} = require("./runtime/castIntoStackLocalOfType");
const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const { RuntimeError } = require("../errors");
const { ExecutionHasBeenTrapped } = require("./kernel/signals");

export function createHostfunc(
  moduleinst: ModuleInstance,
  exportinst: ExportInstance,
  allocator: Allocator,
  { checkForI64InSignature }: InternalInstanceOptions
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

    if (checkForI64InSignature === true) {
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

    try {
      const res = executeStackFrame(stackFrame);

      if (res != null && res.value != null) {
        return res.value.toNumber();
      }
    } catch (e) {
      if (e instanceof ExecutionHasBeenTrapped) {
        throw e;
      } else {
        throw new RuntimeError(e.message);
      }
    }
  };
}
