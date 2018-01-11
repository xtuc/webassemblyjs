// @flow

type Sign = "abs" | "neg";

const i32 = require("../../runtime/values/i32");
const i64 = require("../../runtime/values/i64");
const f32 = require("../../runtime/values/f32");
const f64 = require("../../runtime/values/f64");

// https://webassembly.github.io/spec/core/exec/instructions.html#exec-binop
function unop(
  { value: c }: StackLocal,
  sign: Sign,
  createValue: number => StackLocal
): StackLocal {
  switch (sign) {
    case "abs":
      return createValue(c.abs());

    case "neg":
      return createValue(c.neg());
  }

  throw new Error("Unsupported unop: " + sign);
}

export function unopi32(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, i32.createValue);
}

export function unopi64(c: StackLocal, sign: Sign): StackLocal {
  // $FlowIgnore: since we'll box every number we will have an unified interface ignoring this for now
  return unop(c, sign, i64.createValue);
}

export function unopf32(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, f32.createValue);
}

export function unopf64(c: StackLocal, sign: Sign): StackLocal {
  return unop(c, sign, f64.createValue);
}
