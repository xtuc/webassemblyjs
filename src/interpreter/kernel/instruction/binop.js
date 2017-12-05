// @flow

type Sign = '+' | '-' | '/' | '*';

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
export function binop(c1: number, c2: number, sign: Sign): number {

  switch (sign) {
  // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
  case '+':
    return c1 + c2;

    // https://webassembly.github.io/spec/exec/numerics.html#op-isub
  case '-':
    return c1 - c2;

  // https://webassembly.github.io/spec/exec/numerics.html#op-imul
  case '*':
    return c1 * c2;
  }

  throw new Error('Unsupported binop: ' + sign);
}
