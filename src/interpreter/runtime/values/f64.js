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

export class f64inf extends f64 {
  reinterpret(): i64 {
    // Exponent is all 1's, mantissa is all zeros
    let upper = 0x7ff << 20;

    if (this._value < 0) {
      upper = upper | 0x80000000;
    }

    return new i64(Long.fromBits(0, upper));
  }
}

export function createInfFromAST(sign: number): StackLocal {
  return {
    type,
    value: new f64inf(sign)
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
