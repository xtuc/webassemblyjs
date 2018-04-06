// @flow

export function createStackFrame(
  code: Array<Instruction>,
  locals: Array<StackLocal>,
  originatingModule: ModuleInstance,
  allocator: Allocator
): StackFrame {
  return {
    code,
    locals,

    globals: [],

    /**
     * Labels are named block of code.
     * We maintain a map to access the block for a given identifier.
     *
     * https://webassembly.github.io/spec/core/exec/runtime.html#labels
     */
    labels: [],

    /**
     * Local applicatif Stack for the current stackframe.
     *
     * https://webassembly.github.io/spec/core/exec/runtime.html#stack
     */
    values: [],

    /**
     * We keep a reference to its originating module.
     *
     * When we need to lookup a function by addr for example.
     */
    originatingModule,

    /**
     * For shared memory operations
     */
    allocator,

    /**
     * Program counter, used to track the execution of the code
     */
    _pc: 0
  };
}

export function createChildStackFrame(
  parent: StackFrame,
  code: Array<Instruction>
): StackFrame {
  const { locals, originatingModule, allocator, trace } = parent;

  const frame = createStackFrame(code, locals, originatingModule, allocator);
  frame.trace = trace;

  return frame;
}
