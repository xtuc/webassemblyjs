// @flow

const bits = 32;
const type = 'i32';

export function createValue(value: number): StackLocal {
  value = (value | 0) % Math.pow(2, bits);

  return {
    type,
    value,
  };
}
