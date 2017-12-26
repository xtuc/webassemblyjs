// @flow

const i32 = require('../../runtime/values/i32');
const i64 = require('../../runtime/values/i64');
const f32 = require('../../runtime/values/f32');
const f64 = require('../../runtime/values/f64');
const {createChildStackFrame} = require('../stackframe');
const {isTrapped} = require('../signals');
const {RuntimeError} = require('../../../errors');

const {controlInstructions} = require('./control-instructions');
const {administrativeInstructions} = require('./administrative-instructions');
const {memoryInstructions} = require('./memory-instructions');
const {numericInstructions} = require('./numeric-instructions');

// TODO(sven): can remove asserts call at compile to gain perf in prod
function assert(cond) {

  if (!cond) {
    throw new RuntimeError('Assertion error');
  }
}

function castIntoStackLocalOfType(type: string, v: any): StackLocal {

  const castFn = {
    i32: i32.createValue,
    i64: i64.createValue,
    f32: f32.createValue,
    f64: f64.createValue,
  };

  if (typeof castFn[type] === 'undefined') {
    throw new RuntimeError('Cannot cast: unsupported type ' + type);
  }

  return castFn[type](v);
}

function createInstructionsEvaluator(frame: StackFrame, frameutils: Object, visitor: Object) {

  return function evaluate(instruction: Instruction) {
    let res;

    const fn = visitor[instruction.id];

    if (typeof fn !== 'undefined') {
      const context = Object.assign({}, visitor, frameutils);

      res = fn.bind(context)(instruction, frame);
    }

    if (isTrapped(res)) {
      return res;
    }

  };
}

function assertNItemsOnStack(stack: Array<any>, numberOfItem: number) {
  if (stack.length < numberOfItem) {
    throw new RuntimeError('Assertion error: expected ' + numberOfItem + ' on the stack, found ' + stack.length);
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

export function executeStackFrame(frame: StackFrame, depth: number = 0): any {
  let pc = 0;

  function getLocalByIndex(index: number) {
    const local = frame.locals[index];

    if (typeof local === 'undefined') {
      throw new RuntimeError('Assertion error: no local value at index ' + index);
    }

    frame.values.push(local);
  }

  function setLocalByIndex(index: number, value: StackLocal) {
    assert(typeof index === 'number');

    frame.locals[index] = value;
  }

  function pushResult(res: StackLocal) {
    frame.values.push(res);
  }

  function popArrayOfValTypes(types: Array<Valtype>): any {
    assertNItemsOnStack(frame.values, types.length);

    return types.map((type) => {
      return pop1(type);
    });
  }

  function pop1(type: ?Valtype): any {
    assertNItemsOnStack(frame.values, 1);

    const v = frame.values.pop();

    if (typeof type === 'string' && v.type !== type) {
      throw new RuntimeError(
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
      throw new RuntimeError(
        'Internal failure: expected c2 value of type ' + type2
        + ' on top of the stack, give type: ' + c2.type
      );
    }

    if (c1.type !== type2) {
      throw new RuntimeError(
        'Internal failure: expected c1 value of type ' + type2
        + ' on top of the stack, give type: ' + c1.type
      );
    }

    return [c1, c2];
  }

  const frameutils = {
    assertNItemsOnStack,
    pop1,
    pop2,
    isTrapped,
    assert,
    castIntoStackLocalOfType,
    popArrayOfValTypes,
    pushResult,
    setLocalByIndex,
    isZero,
    getLocalByIndex,

    createAndExecuteChildStackFrame(frame, instructions) {
      const childStackFrame = createChildStackFrame(frame, instructions);
      childStackFrame.trace = frame.trace;

      return executeStackFrame(childStackFrame, depth + 1);
    },
  };

  const evaluateInstruction = createInstructionsEvaluator(frame, frameutils, Object.assign({},
    numericInstructions,
    controlInstructions,
    memoryInstructions,
    administrativeInstructions
  ));

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

    const res = evaluateInstruction(instruction);

    if (isTrapped(res)) {
      return res;
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
