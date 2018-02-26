// @flow
const Long = require("long");

const { RuntimeError } = require("../../../errors");

const bits = 32;
const type = "i32";

// the specification describes the conversion from unsigned to signed
// https://webassembly.github.io/spec/core/exec/numerics.html#aux-signed
// this function performs the inverse
const toUnsigned = a => a >>> 0;

export class i32 implements IntegerValue<i32> {
  _value: number;

  constructor(value: number) {
    // Integers are represented within WebAssembly as unsigned numbers. When crossing the JS <=> WebAssembly boundary
    // they are converted into a signed number.
    this._value = value | 0;
  }

  add(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-iadd
    return new i32(this._value + operand._value);
  }

  sub(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-isub
    return new i32(this._value - operand._value);
  }

  mul(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-imul
    return new i32(
      Long.fromNumber(this._value)
        .mul(Long.fromNumber(operand._value))
        .mod(Math.pow(2, bits))
        .toNumber()
    );
  }

  div_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-s
    if (operand._value == 0) {
      throw new RuntimeError("integer divide by zero");
    }
    // as per: https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-s
    // This operator is partial. Besides division by 0, the result of −2^(N−1) / (−1) = +2^(N−1)
    // is not representable as an N-bit signed integer.
    if (this._value == -0x80000000 && operand._value == -1) {
      throw new RuntimeError("integer overflow");
    }
    return new i32(this._value / operand._value);
  }

  div_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-u
    if (operand._value == 0) {
      throw new RuntimeError("integer divide by zero");
    }
    return new i32(toUnsigned(this._value) / toUnsigned(operand._value));
  }

  rem_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-irem-s
    if (operand._value == 0) {
      throw new RuntimeError("integer divide by zero");
    }
    return new i32(this._value % operand._value);
  }

  rem_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-irem-u
    if (operand._value == 0) {
      throw new RuntimeError("integer divide by zero");
    }
    return new i32(toUnsigned(this._value) % toUnsigned(operand._value));
  }

  shl(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-shl
    return new i32(this._value << operand._value);
  }

  shr_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-shr-s
    return new i32(this._value >> operand._value);
  }

  shr_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-shr-u
    return new i32(this._value >>> operand._value);
  }

  rotl(rotation: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-rotl
    return new i32(
      (this._value << rotation._value) |
        (this._value >>> (bits - rotation._value))
    );
  }

  rotr(rotation: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-rotl
    return new i32(
      (this._value >>> rotation._value) |
        (this._value << (bits - rotation._value))
    );
  }

  clz(): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-iclz
    if (this._value == 0) {
      return new i32(bits);
    }
    let lead = 0;
    let temp = toUnsigned(this._value);
    while ((temp & 0x80000000) == 0) {
      lead++;
      temp = (temp << 1) >>> 0;
    }
    return new i32(lead);
  }

  ctz(): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ictz
    if (this._value == 0) {
      return new i32(bits);
    }
    let lead = 0;
    let temp = toUnsigned(this._value);
    while ((temp & 0x1) == 0) {
      lead++;
      temp = (temp >> 1) >>> 0;
    }
    return new i32(lead);
  }

  popcnt(): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ipopcnt
    let temp = toUnsigned(this._value);
    let count = 0;
    while (temp != 0) {
      if (temp & 0x80000000) {
        count++;
      }
      temp = temp << 1;
    }
    return new i32(count);
  }

  div(): i32 {
    throw new RuntimeError("Unsupported operation");
  }

  and(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-iand
    return new i32(this._value & operand._value);
  }

  or(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ixor
    return new i32(this._value | operand._value);
  }

  xor(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ixor
    return new i32(this._value ^ operand._value);
  }

  eqz(): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieqz
    return new i32(this._value == 0 ? 1 : 0);
  }

  eq(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieq
    return new i32(this._value == operand._value ? 1 : 0);
  }

  ne(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieq
    return new i32(this._value != operand._value ? 1 : 0);
  }

  lt_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-u
    return new i32(
      toUnsigned(this._value) < toUnsigned(operand._value) ? 1 : 0
    );
  }

  lt_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-s
    return new i32(this._value < operand._value ? 1 : 0);
  }

  le_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-u
    return new i32(
      toUnsigned(this._value) <= toUnsigned(operand._value) ? 1 : 0
    );
  }

  le_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-s
    return new i32(this._value <= operand._value ? 1 : 0);
  }

  gt_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-u
    return new i32(
      toUnsigned(this._value) > toUnsigned(operand._value) ? 1 : 0
    );
  }

  gt_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-s
    return new i32(this._value > operand._value ? 1 : 0);
  }

  ge_u(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-u
    return new i32(
      toUnsigned(this._value) >= toUnsigned(operand._value) ? 1 : 0
    );
  }

  ge_s(operand: i32): i32 {
    // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-s
    return new i32(this._value >= operand._value ? 1 : 0);
  }

  equals(operand: i32): boolean {
    return isNaN(this._value)
      ? isNaN(operand._value)
      : this._value == operand._value;
  }

  min(operand: i32): i32 {
    return new i32(Math.min(this._value, operand._value));
  }

  max(operand: i32): i32 {
    return new i32(Math.max(this._value, operand._value));
  }

  abs(): i32 {
    return new i32(Math.abs(this._value));
  }

  neg(): i32 {
    return new i32(-this._value);
  }

  copysign(operand: i32): i32 {
    return new i32(
      Math.sign(this._value) === Math.sign(operand._value)
        ? this._value
        : -this._value
    );
  }

  toNumber(): number {
    return this._value;
  }

  toString(): string {
    return this._value + "";
  }

  isTrue(): boolean {
    // https://webassembly.github.io/spec/core/exec/numerics.html#boolean-interpretation
    return this._value == 1;
  }

  toByteArray(): Array<number> {
    const byteArray: Array<number> = new Array(4);
    for (
      let offset = 0, shift = 0;
      offset < byteArray.length;
      offset++, shift += 8
    ) {
      byteArray[offset] = (this._value >>> shift) & 0xff;
    }
    return byteArray;
  }

  static fromArrayBuffer(
    buffer: ArrayBuffer,
    ptr: number,
    extend: number,
    signed: boolean
  ): i32 {
    const slice = buffer.slice(ptr, ptr + 4);
    let asInt32 = new Int32Array(slice)[0];
    // shift left, then shift right by the same number of bits, using
    // signed or unsigned shifts
    asInt32 <<= extend;
    return new i32(signed ? asInt32 >> extend : asInt32 >>> extend);
  }
}

export function createValueFromAST(value: number): StackLocal {
  return {
    type,
    value: new i32(value)
  };
}

export function createValue(value: i32): StackLocal {
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
    value: i32.fromArrayBuffer(buffer, ptr, extend, signed)
  };
}

export function createTrue(): i32 {
  return new i32(1);
}

export function createFalse(): i32 {
  return new i32(0);
}
