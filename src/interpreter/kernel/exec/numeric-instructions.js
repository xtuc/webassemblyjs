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

export function handleNumericInstructions(
  instruction: Object,
  frame: StackFrame,
  frameutils: Object,
): any {

  switch (instruction.id) {

  case 'add': {

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

    break;
  }

  case 'mul': {

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

    break;
  }

  case 'sub': {

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

    break;
  }

  /**
     * There is two seperated operation for both signed and unsigned integer,
     * but since the host environment will handle that, we don't have too :)
     */
  case 'div_s':
  case 'div_u':
  case 'div': {

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

    break;
  }

  case 'min': {

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

    break;
  }

  case 'max': {

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

    break;
  }

  case 'copysign': {

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

    break;
  }

  }
}
