// @flow
const Long = require("long");

import { RuntimeError } from "../../../errors";

const type = "i64";

export class i64 implements NumberInterface<i64> {
  _value: Long;

  constructor(value: Long) {
    this._value = value;
  }

  add(operand: i64): i64 {
    return new i64(this._value.add(operand._value));
  }

  sub(operand: i64): i64 {
    return new i64(this._value.sub(operand._value));
  }

  mul(operand: i64): i64 {
    return new i64(this._value.mul(operand._value));
  }

  div_s(operand: i64): i64 {
    return new i64(this._value.div(operand._value));
  }

  div_u(operand: i64): i64 {
    return new i64(this._value.div(operand._value));
  }

  div(operand: i64): i64 {
    return new i64(this._value.div(operand._value));
  }

  and(operand: i64): i64 {
    return new i64(this._value.and(operand._value));
  }

  or(operand: i64): i64 {
    return new i64(this._value.or(operand._value));
  }

  xor(operand: i64): i64 {
    return new i64(this._value.xor(operand._value));
  }

  equals(operand: i64): boolean {
    return this._value.equals(operand._value);
  }

  isZero(): boolean {
    return this._value.low == 0 && this._value.high == 0;
  }

  abs(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  copysign(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  max(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  min(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  neg(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  lt_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  lt_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  le_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  le_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  gt_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  gt_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  ge_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  ge_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  rem_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  rem_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  shl(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  shr_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  shr_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  rotl(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  rotr(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  clz(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  ctz(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  popcnt(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  eqz(): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  eq(/* operand: i64 */): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  ne(/* operand: i64 */): i64 {
    throw new RuntimeError("Unsupported operation");
  }

  toString(): string {
    return this._value.toString();
  }

  toNumber(): number {
    return this._value.toNumber();
  }

  isTrue(): boolean {
    // https://webassembly.github.io/spec/core/exec/numerics.html#boolean-interpretation
    return this.toNumber() == 1;
  }
}

export function createValueFromAST(value: LongNumber): StackLocal {
  return {
    type,
    value: new i64(new Long(value.low, value.high))
  };
}

export function createValue(value: i64): StackLocal {
  return {
    type,
    value
  };
}
