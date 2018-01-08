// @flow

const bits = 64;
const type = "i64";

export function createValue(value: number): StackLocal {
  value = (value | 0) % Math.pow(2, bits);

  return {
    type,
    value
  };
}
