// @flow
const Long = require("long");

type Sign =
  | "add"
  | "sub"
  | "div"
  | "div_s"
  | "div_u"
  | "mul"
  | "and"
  | "or"
  | "xor"
  | "~"
  | "min"
  | "max"
  | "copysign";

const i32 = require("../../runtime/values/i32");
const i64 = require("../../runtime/values/i64");
const f32 = require("../../runtime/values/f32");
const f64 = require("../../runtime/values/f64");

// https://webassembly.github.io/spec/exec/instructions.html#exec-binop
function binop(
  { value: c1 }: StackLocal,
  { value: c2 }: StackLocal,
  sign: Sign,
  createValue: number => StackLocal
): StackLocal {
  switch (sign) {
    // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
    case "add":
      return createValue(c1 + c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-isub
    case "sub":
      return createValue(c1 - c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-imul
    case "mul":
      return createValue(c1 * c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-u
    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-s
    case "div_s":
    case "div_u":
    case "div":
      return createValue(c1 / c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-iand
    case "and":
      return createValue(c1 & c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-ior
    case "or":
      return createValue(c1 | c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-ixor
    case "xor":
      return createValue(c1 ^ c2);

    // https://webassembly.github.io/spec/exec/numerics.html#op-fmin
    case "min":
      return createValue(Math.min(c1, c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-fmax
    case "max":
      return createValue(Math.max(c1, c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-fcopysign
    case "copysign":
      return createValue(Math.sign(c1) === Math.sign(c2) ? c1 : -c1);
  }

  throw new Error("Unsupported binop: " + sign);
}

function binopLong(
  { value: c1 }: StackLocal,
  { value: c2 }: StackLocal,
  sign: Sign,
  createValue: LongNumber => StackLocal
): StackLocal {
  switch (sign) {
    // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
    case "add":
      return createValue(c1.add(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-imul
    case "sub":
      return createValue(c1.sub(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-imul
    case "mul":
      return createValue(c1.mul(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-u
    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-s
    case "div_s":
    case "div_u":
    case "div":
      return createValue(c1.div(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-iand
    case "and":
      return createValue(c1.and(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-ior
    case "or":
      return createValue(c1.or(c2));

    // https://webassembly.github.io/spec/exec/numerics.html#op-ixor
    case "xor":
      return createValue(c1.xor(c2));
  }

  throw new Error("Unsupported binop: " + sign);
}

export function binopi32(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(c1, c2, sign, i32.createValue);
}

export function binopi64(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign
): StackLocal {
  return binopLong(c1, c2, sign, function(long: Long): StackLocal {
    return i64.createValue({
      high: long.high,
      low: long.low
    });
  });
}

export function binopf32(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(c1, c2, sign, f32.createValue);
}

export function binopf64(
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(c1, c2, sign, f64.createValue);
}
