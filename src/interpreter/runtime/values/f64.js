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

  static fromArrayBuffer(buffer: ArrayBuffer, ptr: number): f32 {
    const slice = buffer.slice(ptr, ptr + 8);
    const value = new Float64Array(slice);
    return new f64(value[0]);
  }
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
