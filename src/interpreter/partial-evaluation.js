// @flow

const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const module = require("./runtime/values/module");
const t = require("../compiler/AST");

export function evaluate(
  allocator: Allocator,
  code: Array<Instruction>
): ?StackLocal {
  // Create an empty module instance for the context
  const moduleInstance = module.createInstance(
    allocator,
    t.module(undefined, [])
  );

  const stackFrame = createStackFrame(code, [], moduleInstance, allocator);

  const res = executeStackFrame(stackFrame);

  return res;
}
