// @flow

import Long from "long";

import { Float, typedArrayToArray } from "./number";
import { i64 } from "./i64";

const type = "f64";

export class f64 extends Float<i64> {
  reinterpret(): i64 {
    const floatArray = new Float64Array(1);
    floatArray[0] = this._value;
    const lowIntArray = new Int32Array(floatArray.buffer.slice(0, 4));
    const highIntArray = new Int32Array(floatArray.buffer.slice(4, 8));
    return new i64(Long.fromBits(lowIntArray[0], highIntArray[0]));
  }

  toByteArray(): Array<number> {
    const floatArray = new Float64Array(1);
    floatArray[0] = this._value;
    return typedArrayToArray(new Int8Array(floatArray.buffer));
  }

  static fromArrayBuffer(buffer: ArrayBuffer, ptr: number): f64 {
    const slice = buffer.slice(ptr, ptr + 8);
    const value = new Float64Array(slice);
    return new f64(value[0]);
  }
}

export class f64inf extends f64 {
  reinterpret(): i64 {
    // Exponent is all 1's, mantissa is all zeros
    let upper = 0x7ff << 20;

    if (this._value < 0) {
      upper = upper | 0x80000000;
    }

    return new i64(Long.fromBits(0, upper).toSigned());
  }
}

export class f64nan extends f64 {
  reinterpret(): i64 {
    let lower = 0;
    let upper = 0;

    // sign bit of _value shifted to position 0
    if (this._value <= 0) {
      upper = upper | 0x80000000;
    }

    // 11-bit exponent shifted to position 1 through 11
    upper = upper | (0x7ff << 20);

    // 52-bit mantissa which is obtained by disregarding the sign of _value
    const mantissa = this._value <= 0 ? -this._value : this._value;
    lower = lower | (mantissa % 2 ** 32);
    upper = upper | Math.floor(mantissa / 2 ** 32);

    return new i64(Long.fromBits(lower, upper));
  }
}

export function createInfFromAST(sign: number): StackLocal {
  return {
    type,
    value: new f64inf(sign)
  };
}

export function createNanFromAST(payload: number): StackLocal {
  return {
    type,
    value: new f64nan(payload)
  };
}

export function createValueFromAST(value: number): StackLocal {
  return {
    type,
    value: new f64(value)
  };
}

export function createValue(value: f64): StackLocal {
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
    value: f64.fromArrayBuffer(buffer, ptr)
  };
}
