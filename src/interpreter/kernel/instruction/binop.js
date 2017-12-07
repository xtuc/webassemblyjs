// @flow

type Sign = '+' | '-' | '/' | '*';

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
export function binop(c1: StackLocal, c2: StackLocal, sign: Sign): StackLocal {
  const type = 'i32';

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
