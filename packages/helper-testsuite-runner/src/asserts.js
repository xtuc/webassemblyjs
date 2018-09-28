// @flow

import { assert } from "mamacro";
import Long from "@xtuc/long";

function eq(actual: StackLocal, expected: Object) {
  const { type, value } = expected;

  // check type
  assert(actual.type === type);

  // check value
  switch (expected.type) {
    case "i32":
      assert(
        actual.value.toString() === (value | 0).toString(),
        `${actual.value.toString()} doesn't match expected value ${value | 0}`
      );
      break;

    case "i64":
      const i64Value = Long.fromString(value, false).toString();

      assert(
        actual.value.toString() === i64Value,
        `${actual.value.toString()} doesn't match expected value ${i64Value}`
      );
      break;

    default:
      throw new Error("Unsupport eq with type: " + expected.type);
  }
}

// assert action has expected results
// ( assert_return <action> <expr>* )
//
export function assert_return(
  instance: Instance,
  action: Object,
  expected: Object
) {
  const { type, field, args } = action;

  assert(type === "invoke");

  const fn = instance.exports[field];
  assert(typeof fn === "function", `function ${field} not found`);

  const res = fn(...args.map(x => x.value));

  if (expected.length > 0) {
    eq(res, expected[0]);
  }
}

// ;; assert module cannot be decoded with given failure string
// ( assert_malformed <module> <failure> )
//
export function assert_malformed(
  getInstance: () => Instance,
  expected: string
) {
  try {
    getInstance();

    assert(false, "did not throw any error");
  } catch (e) {
    assert(e.message === expected);
  }
}

// assert module is invalid with given failure string
// ( assert_invalid <module> <failure> )
//
export function assert_invalid(getInstance: () => Instance, expected: string) {
  try {
    getInstance();

    assert(false, "did not throw any error");
  } catch (e) {
    assert(
      e.message === expected,
      `Expected error ${expected}, got ${e.message}`
    );
  }
}
