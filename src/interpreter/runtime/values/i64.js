// @flow

const type = 'i64';

export function createValue(value: number): StackLocal {

  return {
    type,
    value: value | 0,
  };
}
