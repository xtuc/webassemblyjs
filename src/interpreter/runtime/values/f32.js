// @flow
import { BaseNumber } from "./number";

const type = "f32";

export class f32 extends BaseNumber {
  add(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the BaseNumber one.
    return operand instanceof f32nan
      ? operand.add(this)
      : BaseNumber.prototype.add.call(this, operand);
  }

  sub(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the BaseNumber one.
    return operand instanceof f32nan
      ? operand.sub(this)
      : BaseNumber.prototype.sub.call(this, operand);
  }

  mul(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the BaseNumber one.
    return operand instanceof f32nan
      ? operand.mul(this)
      : BaseNumber.prototype.mul.call(this, operand);
  }

  div(operand: f32): f32 {
    // If the other operand is a nan we use its implementation, otherwise the BaseNumber one.
    return operand instanceof f32nan
      ? operand.div(this)
      : BaseNumber.prototype.div.call(this, operand);
  }
}

export class f32nan extends f32 {
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
