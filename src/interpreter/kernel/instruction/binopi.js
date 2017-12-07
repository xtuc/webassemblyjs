// @flow

type Sign = '+' | '-' | '/' | '*';

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
function binopi(type: Valtype, c1: StackLocal, c2: StackLocal, sign: Sign) {

  switch (sign) {
  // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
  case '+':
    return {
      value: c1.value + c2.value,
      type,
    };

    // https://webassembly.github.io/spec/exec/numerics.html#op-isub
  case '-':
    return {
      value: c1.value - c2.value,
      type,
    };

  // https://webassembly.github.io/spec/exec/numerics.html#op-imul
  case '*':
    return {
      value: c1.value * c2.value,
      type,
    };

  // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-u
  // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-s
  case '/':
    return {
      value: c1.value / c2.value,
      type,
    };
  }

  throw new Error('Unsupported binop: ' + sign);
}

export function binopi32(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binopi('i32', c1, c2, sign);
}

export function binopi64(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  return binopi('i64', c1, c2, sign);
}
