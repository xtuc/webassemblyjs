// @flow

type Operation =
  | "eq"
  | "ne"
  | "lt_s"
  | "lt_u"
  | "le_s"
  | "le_u"
  | "gt"
  | "gt_s"
  | "gt_u"
  | "ge_s"
  | "ge_u";

const i32 = require("../../runtime/values/i32");

export function compare(
  { value: value1 }: StackLocal,
  { value: value2 }: StackLocal,
  op: Operation
): StackLocal {
  switch (op) {
    case "eq":
      return i32.createValue(value1.eq(value2));

    case "ne":
      return i32.createValue(value1.ne(value2));

    case "lt_s":
      return i32.createValue(value1.lt_s(value2));

    case "lt_u":
      return i32.createValue(value1.lt_u(value2));

    case "le_s":
      return i32.createValue(value1.le_s(value2));

    case "le_u":
      return i32.createValue(value1.le_u(value2));

    case "gt":
      return i32.createValue(value1.gt(value2));

    case "gt_s":
      return i32.createValue(value1.gt_s(value2));

    case "gt_u":
      return i32.createValue(value1.gt_u(value2));

    case "ge_s":
      return i32.createValue(value1.ge_s(value2));

    case "ge_u":
      return i32.createValue(value1.ge_u(value2));
  }

  throw new Error("Unsupported binop: " + op);
}
