// @flow

import { assert } from "mamacro";

// assert action has expected results
// ( assert_return <action> <expr>* )

// action:
//   ( invoke <name>? <string> <expr>* )        ;; invoke function export
//   ( get <name>? <string> )                   ;; get global export

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

  // check type
  assert(res.type === expected[0].type);

  console.log(res, expected[0].value);
  // check value
  assert(res.value.toString() === expected[0].value);
}
