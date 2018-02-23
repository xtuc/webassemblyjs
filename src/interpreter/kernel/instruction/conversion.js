// @flow
import { type i32 } from "../../runtime/values/i32";

export function extendSignedi32(x: i32): LongNumber {
  const value = x._value;

  return {
    high: value < 0 ? -1 : 0,
    low: value >>> 0
  };
}
