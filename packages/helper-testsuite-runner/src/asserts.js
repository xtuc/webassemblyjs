// @flow

import { assert } from "mamacro";
import Long from "@xtuc/long";

function eq(actual: StackLocal, expected: Object) {
  // check type
  assert(actual.type === expected.type);

  // check value
  switch (expected.type) {
    case "i32": {
      const i32Value = Long.fromString(expected.value).toInt();

      assert(
        actual.value.toString() === i32Value.toString(),
        `Expected value ${i32Value}, got ${actual.value.toString()}`
      );
      break;
    }

    case "f32": {
      const actuali32 = actual.value.reinterpret();
      const expectedi32 = Long.fromString(expected.value).toInt();

      assert(
        actuali32.toNumber() === expectedi32,
        `Expected value ${expectedi32}, got ${actuali32.toString()}`
      );

      break;
    }

    case "f64": {
      const actuali32 = actual.value.reinterpret();
      const expectedi32 = Long.fromString(expected.value).toNumber();

      assert(
        actuali32.toNumber() === expectedi32,
        `Expected value ${expectedi32}, got ${actuali32.toString()}`
      );

      break;
    }

    case "i64": {
      const actuali64 = actual.value.toString();
      const expectedi64 = Long.fromString(expected.value)
        .toSigned()
        .toString();

      assert(
        actuali64 === expectedi64,
        `Expected value ${expectedi64}, got ${actuali64}`
      );
      break;
    }

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
