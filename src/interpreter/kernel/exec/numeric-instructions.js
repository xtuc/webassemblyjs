// @flow

const {RuntimeError} = require('../../../errors');

const {
  binopi32,
  binopi64,

  binopf32,
  binopf64,
} = require('./instruction/binop');

/**
 * Numeric Instructions
 *
 * https://webassembly.github.io/spec/exec/instructions.html#numeric-instructions
 */
export const numericInstructions = {

  const(instruction: Instruction, frame: StackFrame, frameutils: Object) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-const

    const n = instruction.args[0];

    if (typeof n === 'undefined') {
      throw new RuntimeError('const requires one argument, none given.');
    }

    if (n.type !== 'NumberLiteral') {
      throw new RuntimeError('const: unsupported value of type: ' + n.type);
    }

    frameutils.pushResult(
      frameutils.castIntoStackLocalOfType(instruction.object, n.value)
    );
  },

  add(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = frameutils.pop2('i32', 'i32');

      frameutils.pushResult(
        binopi32(c2, c1, '+')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = frameutils.pop2('i64', 'i64');

      frameutils.pushResult(
        binopi64(c2, c1, '+')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, '+')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, '+')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);

    }

  },

  mul(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = frameutils.pop2('i32', 'i32');

      frameutils.pushResult(
        binopi32(c2, c1, '*')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = frameutils.pop2('i64', 'i64');

      frameutils.pushResult(
        binopi64(c2, c1, '*')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, '*')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, '*')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);

    }

  },

  sub(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = frameutils.pop2('i32', 'i32');

      frameutils.pushResult(
        binopi32(c2, c1, '-')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = frameutils.pop2('i64', 'i64');

      frameutils.pushResult(
        binopi64(c2, c1, '-')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, '-')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, '-')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);

    }

  },

  div_s(instruction: Instruction, frame: StackFrame, frameutils: Object) {
    this.div(instruction, frame, frameutils);
  },

  div_u(instruction: Instruction, frame: StackFrame, frameutils: Object) {
    this.div(instruction, frame, frameutils);
  },

  /**
   * There is two seperated operation for both signed and unsigned integer,
   * but since the host environment will handle that, we don't have too :)
   */
  div(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = frameutils.pop2('i32', 'i32');

      frameutils.pushResult(
        binopi32(c2, c1, '/')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = frameutils.pop2('i64', 'i64');

      frameutils.pushResult(
        binopi64(c2, c1, '/')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, '/')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, '/')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);

    }

  },

  min(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, 'min')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, 'min')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);
    }

  },

  max(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, 'max')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, 'max')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);
    }

  },

  copysign(instruction: Instruction, frame: StackFrame, frameutils: Object) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = frameutils.pop2('f32', 'f32');

      frameutils.pushResult(
        binopf32(c2, c1, 'copysign')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = frameutils.pop2('f64', 'f64');

      frameutils.pushResult(
        binopf64(c2, c1, 'copysign')
      );

      break;
    }

    default:
      throw new RuntimeError('Unsupported operation ' + instruction.id + ' on ' + instruction.object);
    }

  }

};
