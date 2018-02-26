// @flow

import { RuntimeError } from "../../../errors";

export class Float<U> implements FloatingPointValue<Float<U>, U> {
  _value: number;

  constructor(value: number) {
    this._value = value;
  }

  add(operand: Float<U>): Float<U> {
    return new this.constructor(this._value + operand._value);
  }

  sub(operand: Float<U>): Float<U> {
    return new this.constructor(this._value - operand._value);
  }

  mul(operand: Float<U>): Float<U> {
    return new this.constructor(this._value * operand._value);
  }

  div_s(operand: Float<U>): Float<U> {
    return new this.constructor(this._value / operand._value);
  }

  div_u(operand: Float<U>): Float<U> {
    return new this.constructor(this._value / operand._value);
  }

  div(operand: Float<U>): Float<U> {
    return new this.constructor(this._value / operand._value);
  }

  and(operand: Float<U>): Float<U> {
    return new this.constructor(this._value & operand._value);
  }

  or(operand: Float<U>): Float<U> {
    return new this.constructor(this._value | operand._value);
  }

  xor(operand: Float<U>): Float<U> {
    return new this.constructor(this._value ^ operand._value);
  }

  isZero() {
    return this._value == 0;
  }

  equals(operand: Float<U>): boolean {
    return isNaN(this._value)
      ? isNaN(operand._value)
      : this._value == operand._value;
  }

  min(operand: Float<U>): Float<U> {
    return new this.constructor(Math.min(this._value, operand._value));
  }

  max(operand: Float<U>): Float<U> {
    return new this.constructor(Math.max(this._value, operand._value));
  }

  abs(): Float<U> {
    return new this.constructor(Math.abs(this._value));
  }

  neg(): Float<U> {
    return new this.constructor(-this._value);
  }

  copysign(operand: Float<U>): Float<U> {
    return new this.constructor(
      Math.sign(this._value) === Math.sign(operand._value)
        ? this._value
        : -this._value
    );
  }

  reinterpret(): any {
    throw new RuntimeError("unsupported operation");
  }

  toByteArray(): Array<number> {
    throw new RuntimeError("unsupported operation");
  }

  toNumber(): number {
    return this._value;
  }

  isTrue(): boolean {
    return this._value == 1;
  }

  toString(): string {
    return this.toNumber().toString();
  }
}

export function typedArrayToArray(typedArray: Object) {
  const byteArray = new Array(typedArray.byteLength);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = typedArray[i];
  }
  return byteArray;
}
