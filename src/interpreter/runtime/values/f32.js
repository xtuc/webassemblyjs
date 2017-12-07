// @flow

const type = 'f32';

export function createValue(value: number): StackLocal {

  return {
    type,
    value: parseFloat(value),
  };
}
