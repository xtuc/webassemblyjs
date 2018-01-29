// @flow
import Long from "long";

import { Float } from "./number";
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
