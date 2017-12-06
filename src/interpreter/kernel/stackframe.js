// @flow

export function createStackFrame(
  code: Array<Instruction>,
  locals: Array<StackLocal>,
): StackFrame {

  return {
    code,
    locals,

    globals: [],

    /**
     * Labels are named block of code.
     * We maintain a map to access the block for a given identifier.
     *
     * https://webassembly.github.io/spec/exec/runtime.html#labels
     */
    labels: {},

    /**
     * Local applicatif Stack for the current stackframe
     *
     * https://webassembly.github.io/spec/exec/runtime.html#stack
     */
    values: [],
  };
}
