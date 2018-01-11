// @flow
import { BaseNumber } from "./number";

const bits = 32;
const type = "i32";

export class i32 extends BaseNumber {}

export function createValueFromAST(value: number): StackLocal {
  value = (value | 0) % Math.pow(2, bits);

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
