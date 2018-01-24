// @flow

type Sign =
  | "abs"
  | "neg"
  | "clz"
  | "ctz"
  | "popcnt"
  | "eqz"
  | "reinterpret/f32"
  | "reinterpret/f64";

import * as i32 from "../../runtime/values/i32";
import * as i64 from "../../runtime/values/i64";
import * as f32 from "../../runtime/values/f32";
import * as f64 from "../../runtime/values/f64";

// https://webassembly.github.io/spec/core/exec/instructions.html#exec-binop
function unop(
  { value: value }: StackLocal,
  sign: Sign,
  createValue: any => StackLocal
): StackLocal {
  switch (sign) {
    case "abs":
      return createValue(value.abs());

    case "neg":
      return createValue(value.neg());

    case "clz":
      return createValue(value.clz());

    case "ctz":
      return createValue(value.ctz());

    case "popcnt":
      return createValue(value.popcnt());

    case "eqz":
      return createValue(value.eqz());

    case "reinterpret/f32":
      return i32.createValue(value.reinterpret());

    case "reinterpret/f64":
      return i64.createValue(value.reinterpret());
  }

  throw new Error("Unsupported unop: " + sign);
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
