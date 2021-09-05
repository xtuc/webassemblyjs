// @flow

import Long from "@xtuc/long";

const { RuntimeError } = require("../../../errors");
// eslint-disable-next-line no-unused-vars
import { i32, createTrue, createFalse } from "./i32";
import { define, assert } from "mamacro";

declare function ASSERT_NOT_ZERO(x: any): void;
define(
  ASSERT_NOT_ZERO,
  (x) => `{
    if (${x}._value.isZero()) {
      throw new RuntimeError("integer divide by zero");
    }
  }`
);

declare function TO_BOOLEAN(cond: any): i32;
define(TO_BOOLEAN, (cond) => `(${cond}) ? createTrue() : createFalse()`);

const type = "i64";

export class i64 implements IntegerValue<i64> {
  // $FlowIgnore
  _value: Long;

  // $FlowIgnore
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
    if (this._value.isNegative()) {
      // make it positive
      return this._value.mul(-1);
    }

    return this;
  }

  copysign(/*operand: i64*/): i64 {
    throw new RuntimeError("Unsupported operation: copysign");
  }

  max(operand: i64): i64 {
    if (this._value.lessThan(operand) === true) {
      return operand;
    } else {
      return this;
    }
  }

  min(operand: i64): i64 {
    if (this._value.lessThan(operand) === true) {
      return this;
    } else {
      return operand;
    }
  }

  neg(): i64 {
    return this._value.neg();
  }

  lt_s(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toSigned().lt(operand._value.toSigned()));
  }

  lt_u(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toUnsigned().lt(operand._value.toUnsigned()));
  }

  le_s(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toSigned().lte(operand._value.toSigned()));
  }

  le_u(operand: i64): i32 {
    return TO_BOOLEAN(
      this._value.toUnsigned().lte(operand._value.toUnsigned())
    );
  }

  gt_s(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toSigned().gt(operand._value.toSigned()));
  }

  gt_u(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toUnsigned().gt(operand._value.toUnsigned()));
  }

  ge_s(operand: i64): i32 {
    return TO_BOOLEAN(this._value.toSigned().gte(operand._value.toSigned()));
  }

  ge_u(operand: i64): i32 {
    return TO_BOOLEAN(
      this._value.toUnsigned().gte(operand._value.toUnsigned())
    );
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
    let count = 0;
    const str = this._value.toUnsigned().toString(2);

    for (let i = str.length; i <= 0; i--) {
      if (str[i] !== "0") {
        count++;
      }
    }

    return new i64(new Long(count));
  }

  eqz(): i32 {
    return TO_BOOLEAN(this._value.isZero());
  }

  eq(operand: i64): i32 {
    return TO_BOOLEAN(this.equals(operand));
  }

  ne(operand: i64): i32 {
    return new i32(this.equals(operand) ? 0 : 1);
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
      byteArray[offset] = this._value.shru(shift).and(0xff).toNumber();
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
    value: new i64(new Long(value.low, value.high)),
  };
}

export function createValue(value: i64): StackLocal {
  return {
    type,
    value,
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
    value: i64.fromArrayBuffer(buffer, ptr, extend, signed),
  };
}
