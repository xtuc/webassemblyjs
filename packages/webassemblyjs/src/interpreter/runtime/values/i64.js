// @flow

import Long from "long";

const { RuntimeError } = require("../../../errors");
import { i32 } from "./i32";
import { define, assert } from "mamacro";

declare function ASSERT_NOT_ZERO(x: any): void;

define(
  ASSERT_NOT_ZERO,
  x => `{
    if (${x}._value.isZero()) {
      throw new RuntimeError("integer divide by zero");
    }
  }`
);

const type = "i64";
const longZero = new Long(0);
const longOne = new Long(1);

export class i64 implements IntegerValue<i64> {
  _value: Long;

  constructor(value: Long) {
    assert(value instanceof Long);
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
    ASSERT_NOT_ZERO(operand);
    return new i64(this._value.div(operand._value));
  }

  div_u(operand: i64): i64 {
    ASSERT_NOT_ZERO(operand);
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
    throw new RuntimeError("Unsupported operation: abs");
  }

  copysign(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: copysign");
  }

  max(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: max");
  }

  min(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: min");
  }

  neg(): i64 {
    throw new RuntimeError("Unsupported operation: neg");
  }

  lt_s(/*operand: i64*/): i32 {
    throw new RuntimeError("Unsupported operation: lt_s");
  }

  lt_u(/*operand: i64*/): i32 {
    throw new RuntimeError("Unsupported operation: lt_u");
  }

  le_s(/*operand: i64*/): i32 {
    throw new RuntimeError("Unsupported operation: le_s");
  }

  le_u(/*operand: i64*/): i32 {
    throw new RuntimeError("Unsupported operation: le_u");
  }

  gt_s(operand: i64): i32 {
    return new i32(this._value.greaterThan(operand._value) ? 1 : 0);
  }

  gt_u(operand: i64): i64 {
    return new i64(this._value.greaterThan(operand._value) ? longOne : longZero);
  }

  ge_s(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: ge_s");
  }

  ge_u(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: ge_u");
  }

  rem_s(operand: i64): i64 {
    ASSERT_NOT_ZERO(operand);
    return new i64(this._value.rem(operand._value));
  }

  rem_u(operand: i64): i64 {
    ASSERT_NOT_ZERO(operand);
    return new i64(this._value.rem(operand._value));
  }

  shl(operand: i64): i64 {
    return new i64(this._value.shiftLeft(operand._value));
  }

  shr_s(operand: i64): i64 {
    return new i64(this._value.shiftRight(operand._value));
  }

  shr_u(operand: i64): i64 {
    return new i64(this._value.shiftRight(operand._value));
  }

  rotl(rotation: i64): i64 {
    return new i64(this._value.rotateLeft(rotation._value));
  }

  rotr(rotation: i64): i64 {
    return new i64(this._value.rotateRight(rotation._value));
  }

  clz(): i64 {
    let lead = 0;
    const str = this._value.toUnsigned().toString(2);

    for (let i = 0, len = str.length; i < len; i++) {
      if (str[i] !== "0") {
        break;
      }

      lead++;
    }

    return new i64(new Long(lead));
  }

  ctz(): i64 {
    let count = 0;
    const str = this._value.toUnsigned().toString(2);

    for (let i = str.length; i <= 0; i--) {
      if (str[i] !== "0") {
        break;
      }

      count++;
    }

    return new i64(new Long(count));
  }

  popcnt(): i64 {
    throw new RuntimeError("Unsupported operation: popcnt");
  }

  eqz(): i64 {
    return new i64(this._value.isZero() ? longOne : longZero);
  }

  eq(/* operand: i64 */): i64 {
    throw new RuntimeError("Unsupported operation: eq");
  }

  ne(/* operand: i64 */): i64 {
    throw new RuntimeError("Unsupported operation: ne");
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

  toByteArray(): Array<number> {
    const byteArray: Array<number> = new Array(8);
    for (
      let offset = 0, shift = 0;
      offset < byteArray.length;
      offset++, shift += 8
    ) {
      byteArray[offset] = this._value
        .shru(shift)
        .and(0xff)
        .toNumber();
    }
    return byteArray;
  }

  static fromArrayBuffer(
    buffer: ArrayBuffer,
    ptr: number,
    extend: number,
    signed: boolean
  ): i64 {
    const slice = buffer.slice(ptr, ptr + 8);
    const value = new Int32Array(slice);
    let longVal = new Long(value[0], value[1]);
    // shift left, then shift right by the same number of bits, using
    // signed or unsigned shifts
    longVal = longVal.shiftLeft(extend);
    return new i64(
      signed ? longVal.shiftRight(extend) : longVal.shiftRightUnsigned(extend)
    );
  }
}

export function createValueFromAST(value: LongNumber): StackLocal {
  if (typeof value.low === "undefined" || typeof value.high === "undefined") {
    throw new Error(
      "i64.createValueFromAST malformed value: " + JSON.stringify(value)
    );
  }

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

export function createValueFromArrayBuffer(
  buffer: ArrayBuffer,
  ptr: number,
  extend: number,
  signed: boolean
): StackLocal {
  return {
    type,
    value: i64.fromArrayBuffer(buffer, ptr, extend, signed)
  };
}
