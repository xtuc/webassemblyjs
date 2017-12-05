// @flow
const {binop} = require('./instruction/binop');

export function executeStackFrame(frame: StackFrame): any {
  let pc = 0;

  function getLocal(index: number) {
    const local = frame.locals[index];

    if (typeof local === 'undefined') {
      throw new Error('Assertion error: no local value at index ' + index);
    }

    frame.values.push(local);
  }

  function pushResult(res: StackLocal) {
    frame.values.push(res);
  }

  function pop2(): [any, any] {
    assertNItemsOnStack(frame.values, 2);

    const c2 = frame.values.pop();
    const c1 = frame.values.pop();

    return [c1, c2];
  }

  while (pc < frame.code.length) {
    const instruction = frame.code[pc];

    switch (instruction.id) {

    /**
       * Memory Instructions
       *
       * https://webassembly.github.io/spec/exec/instructions.html#memory-instructions
       */
    case 'get_local': {
      getLocal(instruction.args[0]);
      break;
    }

    /**
       * Numeric Instructions
       *
       * https://webassembly.github.io/spec/exec/instructions.html#numeric-instructions
       */
    case 'i32.add': {
      const [c1, c2] = pop2();

      pushResult(
        binop(c2, c1, '+')
      );

      break;
    }

    case 'i32.sub': {
      const [c1, c2] = pop2();

      pushResult(
        binop(c2, c1, '-')
      );

      break;
    }

    case 'i32.mul': {
      const [c1, c2] = pop2();

      pushResult(
        binop(c2, c1, '*')
      );

      break;
    }

    default:
      // FIXME(sven): this is not spec compliant but great while developing
      throw new Error('Unknown operation: ' + instruction.id);
    }

    if (typeof frame.trace === 'function') {
      frame.trace(pc, instruction.id);
    }

    pc++;
  }

  // Return the item on top of the values/stack;
  return frame.values.pop().value;
}

function assertNItemsOnStack(stack: Array<any>, numberOfItem: number) {
  if (stack.length < numberOfItem) {
    throw new Error('Assertion error: expected ' + numberOfItem + ' on the stack');
  }
}
