// @flow

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
  c1: StackLocal,
  c2: StackLocal,
  sign: Sign,
  createValue: number => StackLocal
): StackLocal {
  switch (sign) {
    // https://webassembly.github.io/spec/exec/numerics.html#op-iadd
    case "add":
      return createValue(c1.value + c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-isub
    case "sub":
      return createValue(c1.value - c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-imul
    case "mul":
      return createValue(c1.value * c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-u
    // https://webassembly.github.io/spec/exec/numerics.html#op-idiv-s
    case "div_s":
    case "div_u":
    case "div":
      return createValue(c1.value / c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-iand
    case "and":
      return createValue(c1.value & c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-ior
    case "or":
      return createValue(c1.value | c2.value);

    // https://webassembly.github.io/spec/exec/numerics.html#op-ixor
    case "xor":
      return createValue(c1.value ^ c2.value);

    case "min":
      return createValue(Math.min(c1.value, c2.value));

    case "max":
      return createValue(Math.max(c1.value, c2.value));

    case "copysign":
      return createValue(
        Math.sign(c1.value) === Math.sign(c2.value) ? c1.value : -c1.value
      );
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
  return binop(c1, c2, sign, i64.createValue);
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
