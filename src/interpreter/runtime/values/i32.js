// @flow
const Long = require("long");

import { RuntimeError } from "../../../errors";

const bits = 32;
const type = "i32";

// the specification describes the conversion from unsigned to signed
// https://webassembly.github.io/spec/core/exec/numerics.html#aux-signed
// this function performs the inverse
const toUnsigned = a => (a < 0 ? a + Math.pow(2, bits) : a);

export class i32 implements Number<i32> {
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

  isZero() {
    return this._value == 0;
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
