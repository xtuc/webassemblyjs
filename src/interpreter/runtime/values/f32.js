// @flow
import { BaseNumber } from "./number";

const type = "f32";

export class f32 extends BaseNumber {}

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
