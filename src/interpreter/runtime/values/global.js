// @flow

const { evaluate } = require("../../partial-evaluation");

export function createInstance(allocator: Allocator, node: Global) {
  let value;
  const { valtype, mutability } = node.globalType;

  const res = evaluate(allocator, node.init);

  if (res != null) {
    value = res.value;
  }

  return {
    type: valtype,
    mutability,
    value
  };
}
