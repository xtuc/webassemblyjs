// @flow

const type = "label";

export function createValue(value: string): StackLocal {
  return {
    type,
    value
  };
}
