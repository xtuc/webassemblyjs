// @flow
const Long = require('long');

const bits = 64;
const type = 'i64';

export function createValue(value: Long): StackLocal {
  return {
    type,
    value: new Long(value.lower, value.upper)
  };
}
