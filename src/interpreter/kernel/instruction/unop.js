// @flow

type Sign = 'abs';

const i32 = require('../../runtime/values/i32');
const i64 = require('../../runtime/values/i64');
const f32 = require('../../runtime/values/f32');
const f64 = require('../../runtime/values/f64');

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
function unop(
  c: StackLocal,
  sign: Sign,
  createValue: (number) => StackLocal
): StackLocal {

  switch (sign) {
  case 'abs':
    return createValue(Math.abs(c.value));

  case 'neg':
    return createValue(-c.value);
  }

  throw new Error('Unsupported unop: ' + sign);
}

export function unopi32(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, i32.createValue);
}

export function unopi64(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, i64.createValue);
}

export function unopf32(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, f32.createValue);
}

export function unopf64(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, f64.createValue);
}
