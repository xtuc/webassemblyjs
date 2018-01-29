// @flow
import { Float } from "./number";
import { i32 } from "./i32";

const type = "f32";

export class f32 extends Float<i32> {
  reinterpret(): i32 {
    const floatArray = new Float32Array(1);
    floatArray[0] = this._value;
    const intArray = new Int32Array(floatArray.buffer);
    return new i32(intArray[0]);
  }

  add(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? operand.add(this)
      : Float.prototype.add.call(this, operand);
  }

  sub(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? operand.sub(this)
      : Float.prototype.sub.call(this, operand);
  }

  mul(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? operand.mul(this)
      : Float.prototype.mul.call(this, operand);
  }

  div(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the Float one.
    return operand instanceof f32nan
      ? operand.div(this)
      : Float.prototype.div.call(this, operand);
  }
}

export class f32nan extends f32 {
  reinterpret(): i32 {
    let result = 0;

    console.log(this);

    // sign bit
    if (this._value <= 0) {
      result = result | 0x80000000;
    }

    // exponent
    result = result | (0xff << 23);

    console.log(result);

    // mantissa
    const mantissa = this._value <= 0 ? -this._value : this._value;
    result = result | mantissa;

    console.log(result);

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

export class f32inf extends f32 {}

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
