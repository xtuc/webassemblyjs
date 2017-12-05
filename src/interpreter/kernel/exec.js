// @flow

export function executeStackFrame(frame: StackFrame): any {
  let pc = 0;

  function getLocal(index: number) {
    if (typeof frame.locals[index] === 'undefined') {
      throw new Error('Assertion error: no local value at index ' + index);
    }

    frame.values.push(frame.locals[index]);
  }


  while (pc < frame.code.length) {
    const instruction = frame.code[pc];

    if (instruction.id === 'get_local') {
      getLocal(instruction.args[0]);

    } else

    // https://webassembly.github.io/spec/exec/instructions.html#exec-binop
    if (instruction.id === 'i32.add') {

      assertNItemsOnStack(frame.values, 2);

      const c2 = frame.values.pop();
      const c1 = frame.values.pop();

      const res = binopt(c2, c1);

      frame.values.push(res);
    } else {
      throw new Error('Unknown operation: ' + instruction.id);
    }

    if (typeof frame.trace === 'function') {
      frame.trace(pc, instruction.id);
    }

    pc++;
  }

  // Return the item on top of the values/stack;
  return frame.values.pop();
}

function assertNItemsOnStack(stack: Array<any>, numberOfItem: number) {
  if (stack.length < numberOfItem) {
    throw new Error('Assertion error: expected ' + numberOfItem + ' on the stack');
  }
}

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
function binopt(c1: number, c2: number): number {
  return c1 + c2;
}
