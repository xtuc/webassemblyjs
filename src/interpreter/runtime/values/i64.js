// @flow
const Long = require("long");

const type = "i64";

export function createValue(value: LongNumber): StackLocal {
  return {
    type,
    value: new Long(value.low, value.high)
  };
}
