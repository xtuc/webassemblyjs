// @flow
import { RuntimeError } from "../../../errors";

export class BaseNumber implements NumberInterface<BaseNumber> {
  _value: number;

  constructor(value: number) {
    this._value = value;
  }

  add(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value + operand._value);
  }

  sub(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value - operand._value);
  }

  mul(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value * operand._value);
  }

  div_s(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value / operand._value);
  }

  div_u(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value / operand._value);
  }

  div(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value / operand._value);
  }

  and(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value & operand._value);
  }

  or(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value | operand._value);
  }

  xor(operand: BaseNumber): BaseNumber {
    return new BaseNumber(this._value ^ operand._value);
  }

  isZero() {
    return this._value == 0;
  }

  equals(operand: BaseNumber): boolean {
    return isNaN(this._value)
      ? isNaN(operand._value)
      : this._value == operand._value;
  }

  min(operand: BaseNumber): BaseNumber {
    return new BaseNumber(Math.min(this._value, operand._value));
  }

  max(operand: BaseNumber): BaseNumber {
    return new BaseNumber(Math.max(this._value, operand._value));
  }

  abs(): BaseNumber {
    return new BaseNumber(Math.abs(this._value));
  }

  neg(): BaseNumber {
    return new BaseNumber(-this._value);
  }

  /*eslint-disable no-unused-vars*/
  rem_s(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  rem_u(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  shl(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  shr_s(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  shr_u(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  rotl(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  rotr(operand: BaseNumber): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  clz(): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }

  ctz(): BaseNumber {
    throw new RuntimeError("Unsupported operation");
  }
  /*eslint-enable */

  copysign(operand: BaseNumber): BaseNumber {
    return new BaseNumber(
      Math.sign(this._value) === Math.sign(operand._value)
        ? this._value
        : -this._value
    );
  }

  toNumber(): number {
    return this._value;
  }
}
