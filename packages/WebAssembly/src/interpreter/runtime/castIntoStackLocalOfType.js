// @flow

const { RuntimeError } = require("../../errors");
const i32 = require("./values/i32");
const i64 = require("./values/i64");
const f32 = require("./values/f32");
const f64 = require("./values/f64");

export function castIntoStackLocalOfType(
  type: string,
  v: any,
  nan: boolean = false,
  inf: boolean = false
): StackLocal {
  const castFn = {
    i32: i32.createValueFromAST,
    i64: i64.createValueFromAST,
    f32: f32.createValueFromAST,
    f64: f64.createValueFromAST
  };

  if (nan === true) {
    castFn.f32 = f32.createNanFromAST;
    castFn.f64 = f64.createNanFromAST;
  }

  if (inf === true) {
    castFn.f32 = f32.createInfFromAST;
    castFn.f64 = f64.createInfFromAST;
  }

  if (typeof castFn[type] === "undefined") {
    throw new RuntimeError(
      "Cannot cast: unsupported type " + JSON.stringify(type)
    );
  }

  return castFn[type](v);
}
