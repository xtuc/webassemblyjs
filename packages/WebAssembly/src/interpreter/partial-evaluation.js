// @flow

const t = require("@webassemblyjs/ast");

const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const modulevalue = require("./runtime/values/module");

export function evaluate(
  allocator: Allocator,
  code: Array<Instruction>
): ?StackLocal {
  // Create an empty module instance for the context
  const moduleInstance = modulevalue.createInstance(
    allocator,
    t.module(undefined, [])
  );

  const stackFrame = createStackFrame(code, [], moduleInstance, allocator);

  const res = executeStackFrame(stackFrame);

  return res;
}
