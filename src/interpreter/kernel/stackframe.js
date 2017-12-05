// @flow

export function createStackFrame(
  code: Array<Instruction>,
  locals: Array<StackLocals>,
): StackFrame {

  return {
    code,
    locals,

    globals: [],

    values: [],
  };
}
