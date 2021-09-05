// @flow

declare function trace(msg?: string): void;

import { assert, define } from "mamacro";

const t = require("@webassemblyjs/ast");

import { RuntimeError } from "../errors";
const {
  castIntoStackLocalOfType,
} = require("./runtime/castIntoStackLocalOfType");
const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const { ExecutionHasBeenTrapped } = require("./kernel/signals");

define(
  trace,
  (msg) => `
    console.log("host " + ${msg});
  `
);

export function createHostfunc(
  ir: IR,
  moduleinst: ModuleInstance,
  exportinst: ExportInstance,
  allocator: Allocator,
  { checkForI64InSignature, returnStackLocal }: InternalInstanceOptions
): Hostfunc {
  return function hostfunc(...args): ?any {
    const exportinstAddr = exportinst.value.addr;

    /**
     * Find callable in instantiated function in the module funcaddrs
     */
    const hasModuleInstantiatedFunc =
      moduleinst.funcaddrs.indexOf(exportinstAddr);

    if (hasModuleInstantiatedFunc === -1) {
      throw new RuntimeError(
        `Function at addr ${exportinstAddr.index} has not been initialized in the module.` +
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
        `Function ${exportinstAddr.index} called with ${args.length} arguments but ` +
          funcinst.type[0].length +
          " expected"
      );
    }

    const argsWithType = args.map((value: any, i: number): StackLocal =>
      castIntoStackLocalOfType(funcinstArgs[i], value)
    );

    const stackFrame = createStackFrame(
      argsWithType,
      funcinst.module,
      allocator
    );

    // push func's params into stackFrame locals
    stackFrame.locals.push(...argsWithType);

    // 2. Enter the block instr∗ with label
    // stackFrame.values.push(label.createValue(exportinst.name));

    stackFrame.labels.push({
      value: funcinst,
      arity: funcinstArgs.length,
      id: t.identifier(exportinst.name),
    });

    trace("invoking " + exportinst.name);

    return executeStackFrameAndGetResult(
      ir,
      funcinst.atOffset,
      stackFrame,
      returnStackLocal
    );
  };
}

export function executeStackFrameAndGetResult(
  ir: IR,
  offset: number,
  stackFrame: StackFrame,
  returnStackLocal: boolean
): any {
  try {
    const res = executeStackFrame(ir, offset, stackFrame);

    if (returnStackLocal === true) {
      return res;
    }

    if (res != null && res.value != null) {
      assert(res.type !== "label");

      return res.value.toNumber();
    }
  } catch (e) {
    if (e instanceof ExecutionHasBeenTrapped) {
      throw e;
    } else {
      const err = new RuntimeError(e.message);
      err.stack = e.stack;

      throw err;
    }
  }
}
