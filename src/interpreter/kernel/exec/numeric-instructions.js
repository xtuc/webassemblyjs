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

  const(instruction: ObjectInstruction) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-const

    const n = instruction.args[0];

    if (typeof n === 'undefined') {
      throw new RuntimeError('const requires one argument, none given.');
    }

    if (n.type !== 'NumberLiteral') {
      throw new RuntimeError('const: unsupported value of type: ' + n.type);
    }

    this.pushResult(
      this.castIntoStackLocalOfType(instruction.object, n.value)
    );
  },

  add(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = this.pop2('i32', 'i32');

      this.pushResult(
        binopi32(c2, c1, '+')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = this.pop2('i64', 'i64');

      this.pushResult(
        binopi64(c2, c1, '+')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, '+')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, '+')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  mul(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = this.pop2('i32', 'i32');

      this.pushResult(
        binopi32(c2, c1, '*')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = this.pop2('i64', 'i64');

      this.pushResult(
        binopi64(c2, c1, '*')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, '*')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, '*')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  sub(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = this.pop2('i32', 'i32');

      this.pushResult(
        binopi32(c2, c1, '-')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = this.pop2('i64', 'i64');

      this.pushResult(
        binopi64(c2, c1, '-')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, '-')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, '-')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  div_s(instruction: Instruction, frame: StackFrame) {
    this.div(instruction, frame);
  },

  div_u(instruction: Instruction, frame: StackFrame) {
    this.div(instruction, frame);
  },

  /**
   * There is two seperated operation for both signed and unsigned integer,
   * but since the host environment will handle that, we don't have too :)
   */
  div(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'i32': {
      const [c1, c2] = this.pop2('i32', 'i32');

      this.pushResult(
        binopi32(c2, c1, '/')
      );

      break;
    }

    case 'i64': {
      const [c1, c2] = this.pop2('i64', 'i64');

      this.pushResult(
        binopi64(c2, c1, '/')
      );

      break;
    }

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, '/')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, '/')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  min(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, 'min')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, 'min')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  max(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, 'max')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, 'max')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  },

  copysign(instruction: ObjectInstruction) {

    switch (instruction.object) {

    case 'f32': {
      const [c1, c2] = this.pop2('f32', 'f32');

      this.pushResult(
        binopf32(c2, c1, 'copysign')
      );

      break;
    }

    case 'f64': {
      const [c1, c2] = this.pop2('f64', 'f64');

      this.pushResult(
        binopf64(c2, c1, 'copysign')
      );

      break;
    }

    default:
      this.throwUnsupportedOperationOnObjectInstruction(instruction.id, instruction.object);
    }

  }

};
