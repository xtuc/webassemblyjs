// @flow

import { Float, typedArrayToArray } from "./number";
import { i32 } from "./i32";

const type = "f32";

export class f32 extends Float<f32> {
  reinterpret(): i32 {
    const floatArray = new Float32Array(1);
    floatArray[0] = this._value;
    const intArray = new Int32Array(floatArray.buffer);
    return new i32(intArray[0]);
  }

  add(operand: Float<f32>): Float<f32> {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? // $FlowIgnore
        operand.add(this)
      : Float.prototype.add.call(this, operand);
  }

  sub(operand: Float<f32>): Float<f32> {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? // $FlowIgnore
        operand.sub(this)
      : Float.prototype.sub.call(this, operand);
  }

  mul(operand: Float<f32>): Float<f32> {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? // $FlowIgnore
        operand.mul(this)
      : Float.prototype.mul.call(this, operand);
  }

  div(operand: Float<f32>): Float<f32> {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? // $FlowIgnore
        operand.div(this)
      : Float.prototype.div.call(this, operand);
  }

  toByteArray(): Array<number> {
    const floatArray = new Float32Array(1);
    floatArray[0] = this._value;
    return typedArrayToArray(new Int8Array(floatArray.buffer));
  }

  static fromArrayBuffer(buffer: ArrayBuffer, ptr: number): f32 {
    const slice = buffer.slice(ptr, ptr + 4);
    const value = new Float32Array(slice);
    return new f32(value[0]);
  }

  gt(operand: Float<f32>): i32 {
    const one = new i32(1);
    const zero = new i32(0);

    const z1 = this;
    const z2 = operand;

    // If either z1 or z2 is a NaN, then return 0.
    if (isNaN(z1._value) === true || isNaN(z2._value) === true) {
      return zero;
    }

    // Else if z1 and z2 are the same value, then return 0.
    if (z1.equals(z2) === true) {
      return zero;
    }

    // Else if z1 is positive infinity, then return 1.
    if (Math.sign(z1._value) === 1 && z1 instanceof f32inf) {
      return one;
    }

    // Else if z1 is negative infinity, then return 0.
    if (Math.sign(z1._value) === -1 && z1 instanceof f32inf) {
      return one;
    }

    // Else if z2 is positive infinity, then return 0.
    if (Math.sign(z2._value) === 1 && z2 instanceof f32inf) {
      return zero;
    }

    // Else if z2 is negative infinity, then return 1.
    if (Math.sign(z2._value) === -1 && z2 instanceof f32inf) {
      return one;
    }

    // Else if both z1 and z2 are zeroes, then return 0.
    if (z1._value === 0 && z2._value === 0) {
      return zero;
    }

    // Else if z1 is larger than z2, then return 1.
    if (z1._value > z2._value) {
      return one;
    }

    // Else return 0.
    return zero;
  }
}

export class f32nan extends f32 {
  /**
   * Interprets the bit representation for this nan as an integer
   * https://webassembly.github.io/spec/core/syntax/values.html#floating-point
   *
   * A 32 bit nan looks like this
   *
   * ------------------------------
   * |s|1|1|1|1|1|1|1|1|m1|...|m23|
   * ------------------------------
   *
   * The exponent is all 1's and the mantissa [m1,...m23] is non-zero ().
   *
   * We store sign and mantissa both in the _value field,
   * which is reflected by the computation below.
   */
  reinterpret(): i32 {
    let result = 0;

    // sign bit of _value shifted to position 0
    if (this._value <= 0) {
      result = result | 0x80000000;
    }

    // 8-bit exponent shifted to position 1 through 8
    result = result | (0xff << 23);

    // 23-bit mantissa which is obtained by disregarding the sign of _value
    const mantissa = this._value <= 0 ? -this._value : this._value;
    result = result | mantissa;

    return new i32(result);
  }

  add(): f32 {
    // nan(z1) + x = nan(z1) a is valid execution.
    return this;
  }

  sub(): f32 {
    return this;
  }

  mul(): f32 {
    return this;
  }

  div(): f32 {
    return this;
  }
}

export class f32inf extends f32 {
  reinterpret(): i32 {
    // Exponent is all 1's, mantissa is all zeros
    let result = 0xff << 23;

    if (this._value < 0) {
      result = result | 0x80000000;
    }

    return new i32(result);
  }
}

export function createInfFromAST(sign: number): StackLocal {
  return {
    type,
    value: new f32inf(sign)
  };
}

export function createNanFromAST(payload: number): StackLocal {
  return {
    type,
    value: new f32nan(payload)
  };
}

export function createValueFromAST(value: number): StackLocal {
  return {
    type,
    value: new f32(value)
  };
}

export function createValue(value: f32): StackLocal {
  return {
    type,
    value
  };
}

export function createValueFromArrayBuffer(
  buffer: ArrayBuffer,
  ptr: number
): StackLocal {
  return {
    type,
    value: f32.fromArrayBuffer(buffer, ptr)
  };
}
