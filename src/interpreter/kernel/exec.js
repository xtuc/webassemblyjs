// @flow

const TRAPPED = 'TRAPPED';

const {binop} = require('./instruction/binop');
const i32 = require('../runtime/values/i32');
const label = require('../runtime/values/label');
const {createChildStackFrame} = require('./stackframe');

export function executeStackFrame(frame: StackFrame, depth: number = 0): any {
  let pc = 0;

  function getLocal(index: number) {
    const local = frame.locals[index];

    if (typeof local === 'undefined') {
      throw new Error('Assertion error: no local value at index ' + index);
    }

    frame.values.push(local);
  }

  function setLocal(index: number, value: StackLocal) {
    frame.locals[index] = value;
  }

  function pushResult(res: StackLocal) {
    frame.values.push(res);
  }

  function pop1(type: Valtype): any {
    assertNItemsOnStack(frame.values, 1);

    const v = frame.values.pop();

    if (v.type !== type) {
      throw new Error(
        'Internal failure: expected value of type ' + type
        + ' on top of the stack, give type: ' + v.type
      );
    }

    return v;
  }

  function pop2(type1: Valtype, type2: Valtype): [any, any] {
    assertNItemsOnStack(frame.values, 2);

    const c2 = frame.values.pop();
    const c1 = frame.values.pop();

    if (c2.type !== type2) {
      throw new Error(
        'Internal failure: expected c2 value of type ' + type2
        + ' on top of the stack, give type: ' + c2.type
      );
    }

    if (c1.type !== type2) {
      throw new Error(
        'Internal failure: expected c1 value of type ' + type2
        + ' on top of the stack, give type: ' + c1.type
      );
    }

    return [c1, c2];
  }

  while (pc < frame.code.length) {
    const instruction = frame.code[pc];

    switch (instruction.type) {

    /**
     * Function declaration
     *
     * FIXME(sven): seems unspecified in the spec but it's required for the `call`
     * instruction.
     */
    case 'Func': {
      const func = instruction;

      /**
       * Register the function into the stack frame labels
       */
      if (typeof func.id === 'string') {
        frame.labels[func.id] = func;
      }

      break;
    }

    }

    switch (instruction.id) {

    case 'i32.const': {
      // https://webassembly.github.io/spec/exec/instructions.html#exec-const

      const n = instruction.args[0];

      if (typeof n === 'undefined') {
        throw new Error('i32.const requires one argument, none given.');
      }

      pushResult(
        i32.createValue(n)
      );

      break;
    }

    /**
     * Control Instructions
     *
     * https://webassembly.github.io/spec/exec/instructions.html#control-instructions
     */
    case 'nop': {
      // Do nothing
      // https://webassembly.github.io/spec/exec/instructions.html#exec-nop
      break;
    }

    case 'loop': {
      // https://webassembly.github.io/spec/exec/instructions.html#exec-loop
      const loop = instruction;

      if (loop.instr.length > 0) {
        const childStackFrame = createChildStackFrame(frame, loop.instr);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (res === TRAPPED) {
          return TRAPPED;
        }
      }

      break;
    }

    case 'call': {
      // According to the spec call doesn't support an Identifier as argument
      // but the Script syntax supports it.
      // https://webassembly.github.io/spec/exec/instructions.html#exec-call

      const call = instruction;

      if (call.index.type === 'Identifier') {
        const element = frame.labels[call.index.name];

        if (typeof element === 'undefined') {
          throw new Error('Cannot call ' + call.index.name + ': label not found on the call stack');
        }

        if (element.type === 'Func') {

          const childStackFrame = createChildStackFrame(frame, element.body);

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (res === TRAPPED) {
            return TRAPPED;
          }

          if (typeof res !== 'undefined') {
            pushResult(res);
          }
        }
      }

      break;
    }

    case 'block': {
      const block = instruction;

      /**
       * Used to keep track of the number of values added on top of the stack
       * because we need to remove the label after the execution of this block.
       */
      let numberOfValuesAddedOnTopOfTheStack = 0;

      /**
       * When entering block push the label onto the stack
       */
      if (typeof block.label === 'string') {

        pushResult(
          label.createValue(block.label)
        );
      }

      if (block.instr.length > 0) {
        const childStackFrame = createChildStackFrame(frame, block.instr);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (res === TRAPPED) {
          return TRAPPED;
        }

        if (typeof res !== 'undefined') {
          pushResult(res);
          numberOfValuesAddedOnTopOfTheStack++;
        }
      }

      /**
       * Wen exiting the block
       *
       * > Let m be the number of values on the top of the stack
       *
       * The Stack (values) are seperated by StackFrames and we are running on
       * one single thread, there's no need to check if values were added.
       *
       * We tracked it in numberOfValuesAddedOnTopOfTheStack anyway.
       */
      const topOfTheStack = frame.values.slice(frame.values.length - numberOfValuesAddedOnTopOfTheStack);

      frame.values.splice(frame.values.length - numberOfValuesAddedOnTopOfTheStack);

      pop1('label');

      frame.values = [...frame.values, ...topOfTheStack];

      break;
    }

    case 'if': {

      /**
       * Execute test
       */
      const childStackFrame = createChildStackFrame(frame, instruction.test);
      childStackFrame.trace = frame.trace;

      const res = executeStackFrame(childStackFrame, depth + 1);

      if (res === TRAPPED) {
        return TRAPPED;
      }

      if (!isZero(res)) {

        /**
         * Execute consequent
         */
        const childStackFrame = createChildStackFrame(frame, instruction.consequent);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (res === TRAPPED) {
          return TRAPPED;
        }

        if (typeof res !== 'undefined') {
          pushResult(res);
        }

      } else if (typeof instruction.alternate !== 'undefined' && instruction.alternate.length > 0) {

        /**
         * Execute alternate
         */
        const childStackFrame = createChildStackFrame(frame, instruction.alternate);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (res === TRAPPED) {
          return TRAPPED;
        }

        if (typeof res !== 'undefined') {
          pushResult(res);
        }

      }

      break;
    }

    /**
     * Administrative Instructions
     *
     * https://webassembly.github.io/spec/exec/runtime.html#administrative-instructions
     */
    case 'unreachable':
    // https://webassembly.github.io/spec/exec/instructions.html#exec-unreachable
    case 'trap': {
      // signalling abrupt termination
      // https://webassembly.github.io/spec/exec/runtime.html#syntax-trap
      return TRAPPED;
    }

    /**
     * Memory Instructions
     *
     * https://webassembly.github.io/spec/exec/instructions.html#memory-instructions
     */
    case 'get_local': {
      // https://webassembly.github.io/spec/exec/instructions.html#exec-get-local
      const index = instruction.args[0];

      if (typeof index === 'undefined') {
        throw new Error('get_local requires one argument, none given.');
      }

      getLocal(index);

      break;
    }

    case 'set_local': {
      // https://webassembly.github.io/spec/exec/instructions.html#exec-set-local
      const index = instruction.args[0];
      const init = instruction.args[1];

      if (init.type === 'Instr') {
        const childStackFrame = createChildStackFrame(frame, [init]);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (res === TRAPPED) {
          return TRAPPED;
        }

        setLocal(index, res);
      }

      break;
    }

    /**
     * Numeric Instructions
     *
     * https://webassembly.github.io/spec/exec/instructions.html#numeric-instructions
     */
    case 'i32.add': {
      const [c1, c2] = pop2('i32', 'i32');

      pushResult(
        binop(c2, c1, '+')
      );

      break;
    }

    case 'i32.sub': {
      const [c1, c2] = pop2('i32', 'i32');

      pushResult(
        binop(c2, c1, '-')
      );

      break;
    }

    case 'i32.mul': {
      const [c1, c2] = pop2('i32', 'i32');

      pushResult(
        binop(c2, c1, '*')
      );

      break;
    }
    }

    if (typeof frame.trace === 'function') {
      frame.trace(depth, pc, instruction);
    }

    pc++;
  }

  // Return the item on top of the values/stack;
  if (frame.values.length > 0) {
    return frame.values.pop();
  }
}

function assertNItemsOnStack(stack: Array<any>, numberOfItem: number) {
  if (stack.length < numberOfItem) {
    throw new Error('Assertion error: expected ' + numberOfItem + ' on the stack');
  }
}

function valueEq(l: StackLocal, r: StackLocal): boolean {
  return l.value == r.value && l.type == r.type;
}

function isZero(v: StackLocal): boolean {
  if (typeof v === 'undefined') {
    return false;
  }

  const zero = i32.createValue(0);

  return valueEq(v, zero);
}
