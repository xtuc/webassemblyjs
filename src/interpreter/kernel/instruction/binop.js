// @flow
const Long = require('long');

type Sign = '+' | '-' | '/' | '*' | '&' | '|' | '^' | '~' | 'min' | 'max' | 'copysign';

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

  // https://webassembly.github.io/spec/exec/numerics.html#op-iand
  case '&':
    return createValue(c1.value & c2.value);

  // https://webassembly.github.io/spec/exec/numerics.html#op-ior
  case '|':
    return createValue(c1.value | c2.value);

  // https://webassembly.github.io/spec/exec/numerics.html#op-ixor
  case '^':
    return createValue(c1.value ^ c2.value);

  case 'min':
    return createValue(Math.min(c1.value, c2.value));

  case 'max':
    return createValue(Math.max(c1.value, c2.value));

  case 'copysign':
    return createValue((Math.sign(c1.value) === Math.sign(c2.value)) ? c1.value : -c1.value);
  }

  throw new Error('Unsupported binop: ' + sign);
}

function binopi64s(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign,
  createValue: (Long) => StackLocal
): StackLocal {
  
  let res;

  switch (sign) {
  // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
  case '+':
    res = c1.value.add(c2.value);
    return createValue({
      upper: res.high,
      lower: res.low
    });

  case '-':
    res = c1.value.sub(c2.value);
    return createValue({
      upper: res.high,
      lower: res.low
    });
  }

  throw new Error('Unsupported binop: ' + sign);
}

export function binopi32(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, i32.createValue);
}

export function binopi64(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binopi64s(c1, c2, sign, i64.createValue);
}

export function binopf32(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, f32.createValue);
}

export function binopf64(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binop(c1, c2, sign, f64.createValue);
}
