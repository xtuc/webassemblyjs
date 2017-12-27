// @flow

const type = 'f64';

export function createValue(value: number): StackLocal {

  return {
    type,
    value: value === 0 ? value : parseFloat(value),
  };
}
