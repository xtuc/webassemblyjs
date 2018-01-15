// @flow
import { BaseNumber } from "./number";

const type = "f64";

export class f64 extends BaseNumber {}

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
