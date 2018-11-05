// @flow

export function createStackFrame(
  locals: Array<StackLocal>,
  originatingModule: ModuleInstance,
  allocator: Allocator
): StackFrame {
  return {
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
     * The callee address
     */
    returnAddress: -1
  };
}

export function createChildStackFrame(
  parent: StackFrame,
  pc: number
): StackFrame {
  const { locals, originatingModule, allocator, trace } = parent;

  const frame = createStackFrame(locals, originatingModule, allocator);
  frame.trace = trace;
  frame.returnAddress = pc;

  return frame;
}
