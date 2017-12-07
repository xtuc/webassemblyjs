// @flow

type Sign = '+' | '-' | '/' | '*';

const i32 = require('../../runtime/values/i32');
const i64 = require('../../runtime/values/i64');
const f32 = require('../../runtime/values/f32');
const f64 = require('../../runtime/values/f64');

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
function binop(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign,
  createValue: (number) => StackLocal
): StackLocal {

  switch (sign) {
  // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
  case '+':
    return createValue(c1.value + c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-isub
  case '-':
    return createValue(c1.value - c2.value);

  // https://webassembly.github.io/spec/exec/numerics.html#op-imul
  case '*':
    return createValue(c1.value * c2.value);

  // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-u
  // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-s
  case '/':
    return createValue(c1.value / c2.value);
  }

  throw new Error('Unsupported binop: ' + sign);
}

export function binopi32(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, i32.createValue);
}

export function binopi64(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, i64.createValue);
}

export function binopf32(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, f32.createValue);
}

export function binopf64(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, f64.createValue);
}
