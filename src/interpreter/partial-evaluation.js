// @flow

const {RuntimeError} = require('../errors');
const {isTrapped} = require('./kernel/signals');
const {executeStackFrame} = require('./kernel/exec');
const {createStackFrame} = require('./kernel/stackframe');

export function evaluate(
  allocator: Allocator,
  code: Array<Instruction>
): StackLocal {

  const module = undefined;

  const stackFrame = createStackFrame(code, [], module, allocator);

  const res = executeStackFrame(stackFrame);

  if (isTrapped(res)) {
    throw new RuntimeError('Execution has been trapped');
  }

  return res;
}
