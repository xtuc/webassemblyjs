// @flow
const Long = require("long");

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
    throw new Error("Not implemented yet");
  }

  copysign(/*operand: i64*/): i64 {
    throw new Error("Not implemented yet");
  }

  max(/*operand: i64*/): i64 {
    throw new Error("Not implemented yet");
  }

  min(/*operand: i64*/): i64 {
    throw new Error("Not implemented yet");
  }

  neg(): i64 {
    throw new Error("Not implemented yet");
  }

  toNumber(): number {
    return this._value.toNumber();
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
