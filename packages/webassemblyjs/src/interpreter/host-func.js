// @flow

const t = require("@webassemblyjs/ast");

import { RuntimeError } from "../errors";
const {
  castIntoStackLocalOfType
} = require("./runtime/castIntoStackLocalOfType");
const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const label = require("./runtime/values/label");
const { ExecutionHasBeenTrapped } = require("./kernel/signals");

export function createHostfunc(
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

    // 2. Enter the block instr∗ with label
    stackFrame.values.push(label.createValue(exportinst.name));

    stackFrame.labels.push({
      value: funcinst,
      arity: funcinstArgs.length,
      id: t.identifier(exportinst.name)
    });

    // function trace(depth, pc, i, frame) {
    //   function ident() {
    //     let out = "";

    //     for (let i = 0; i < depth; i++) {
    //       out += "\t|";
    //     }

    //     return out;
    //   }

    //   console.log(
    //     ident(),
    //     `-------------- pc: ${pc} - depth: ${depth} --------------`
    //   );

    //   console.log(ident(), "instruction:", i.id);

    //   console.log(ident(), "locals:");
    //   frame.locals.forEach((stackLocal: StackLocal) => {
    //     console.log(
    //       ident(),
    //       `\t- type: ${stackLocal.type}, value: ${stackLocal.value}`
    //     );
    //   });

    //   console.log(ident(), "values:");
    //   frame.values.forEach((stackLocal: StackLocal) => {
    //     console.log(
    //       ident(),
    //       `\t- type: ${stackLocal.type}, value: ${stackLocal.value}`
    //     );
    //   });

    //   console.log(ident(), "");

    //   console.log(ident(), "labels:");
    //   frame.labels.forEach((label, k) => {
    //     let value = "unknown";

    //     if (label.id != null) {
    //       value = label.id.value;
    //     }
    //     console.log(ident(), `\t- ${k} id: ${value}`);
    //   });

    //   console.log(
    //     ident(),
    //     "--------------------------------------------------\n"
    //   );
    // }

    // stackFrame.trace = trace;

    return executeStackFrameAndGetResult(stackFrame, returnStackLocal);
  };
}

export function executeStackFrameAndGetResult(
  stackFrame: StackFrame,
  returnStackLocal: boolean
): any {
  try {
    const res = executeStackFrame(stackFrame);

    if (returnStackLocal === true) {
      return res;
    }

    if (res != null && res.value != null) {
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
