// @flow

const type = 'f64';

export function createValue(value: number): StackLocal {

  return {
    type,
    value: parseFloat(value),
  };
}
