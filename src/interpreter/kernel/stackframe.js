// @flow

export function createStackFrame(
  code: Array<Instruction>,
  locals: Array<StackLocal>,
): StackFrame {

  return {
    code,
    locals,

    globals: [],

    values: [],
  };
}
