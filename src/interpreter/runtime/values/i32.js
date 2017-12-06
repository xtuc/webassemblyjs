// @flow
const type = 'i32';

export function createValue(value: number): StackLocal {

  return {
    type,
    value
  };
}
