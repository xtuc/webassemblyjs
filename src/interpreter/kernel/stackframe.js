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

    _unwindReason: 0
  };
}

export function createChildStackFrame(
  parent: StackFrame,
  code: Array<Instruction>
): StackFrame {
  const {
    locals,
    originatingModule,
    labels,
    allocator,
    _unwindReason,
    trace
  } = parent;

  const frame = createStackFrame(code, locals, originatingModule, allocator);
  frame.trace = trace;

  frame.parent = parent;

  return frame;
}

export function toString(frame: StackFrame): string {
  let out = "";

  out += "Stack frame-------------------------------------------------------\n";

  out += "code:\n";
  frame.code.forEach((i: Instruction) => {
    out += `\t- id: ${i.id}\n`;
  });

  out += "\nunwind reason: " + frame._unwindReason;

  out += "\nlocals:\n";
  frame.locals.forEach((stackLocal: StackLocal) => {
    out += `\t- type: ${stackLocal.type}, value: ${stackLocal.value}\n`;
  });

  out += "\nvalues:\n";
  frame.values.forEach((stackLocal: StackLocal) => {
    out += `\t- type: ${stackLocal.type}, value: ${stackLocal.value}\n`;
  });

  out += "\n";

  out += "labels:\n";
  frame.labels.forEach((label, k) => {
    out += `\t- ${k} id: ${label.id.value}\n`;
  });

  out += "------------------------------------------------------------------\n";

  return out;
}
