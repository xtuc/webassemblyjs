// @flow

import { assert } from "mamacro";
import Long from "@xtuc/long";

function eq(actual: StackLocal, expected: Object) {
  // check type
  assert(
    actual.type === expected.type,
    `type mismatch; expected ${expected.type}, given ${actual.type}`
  );

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
      console.warn("eq with i64 is unsupported");
      // const actuali64 = actual.value.toString();
      // const expectedi64 = Long.fromString(expected.value)
      //   .toSigned()
      //   .toString();

      // FIXME(sven): fix this
      // assert(
      //   actuali64 === expectedi64,
      //   `Expected value ${expectedi64}, got ${actuali64}`
      // );
      break;
    }

    default:
      throw new Error("Unsupport eq with type: " + expected.type);
  }
}

// assert action has expected results
// ( assert_return <action> <expr>* )
//
export function assert_return(element: any, action: Object, expected: Object) {
  const { type, args } = action;

  assert(type === "invoke" || type === "get", `unsupported type "${type}"`);

  if (type === "get") {
    if (expected.length > 0) {
      eq(element, expected[0]);
    }
  }

  if (type === "invoke") {
    const compatibleArgs = args.map(x => {
      if (x.type === "i64") {
        return new Long.fromString(x.value);
      }

      return x.value;
    });

    const res = element(...compatibleArgs);

    if (expected.length > 0) {
      eq(res, expected[0]);
    }
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
    assert(
      e.message.match(new RegExp(expected, "gm")),
      `Expected error "${expected}", got "${e.message}"`
    );
  }
}

// assert module is invalid with given failure string
// ( assert_invalid <module> <failure> )
//
export function assert_invalid(getInstance: () => Instance, expected: string) {
  if (expected === "type mismatch") {
    expected = "Expected type|Stack contains additional type";
  }

  try {
    getInstance();

    assert(false, "did not throw any error");
  } catch (e) {
    assert(
      e.message.match(new RegExp(expected, "gm")),
      `Expected error "${expected}", got "${e.message}"`
    );
  }
}

// assert module traps on instantiation
// ( assert_trap <module> <failure> )
//
export function assert_trap(element: any, action: Object, expected: string) {
  const { type, args } = action;

  assert(type === "invoke", `unsupported type "${type}"`);

  if (type === "invoke") {
    const compatibleArgs = args.map(x => {
      if (x.type === "i64") {
        return new Long.fromString(x.value);
      }

      return x.value;
    });

    try {
      element(...compatibleArgs);
    } catch (e) {
      assert(
        e.message.match(new RegExp(expected, "gm")),
        `Expected error "${expected}", got "${e.message}"`
      );
    }
  }
}
