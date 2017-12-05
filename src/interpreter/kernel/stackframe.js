// @flow

export function createStackFrame(
  instructions: Array<Instruction>,
  locals: Array<any>,
): StackFrame {

  return {
    code: instructions,
    locals,

    globals: [],

    values: [],
  };
}
