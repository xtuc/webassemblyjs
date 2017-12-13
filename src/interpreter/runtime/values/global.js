// @flow

const {evaluate} = require('../../partial-evaluation');

export function createInstance(allocator: Allocator, node: Global) {
  const {valtype, mutability} = node.globalType;

  const res = evaluate(allocator, node.init);

  return {
    type: valtype,
    mutability,

    value: res.value,
  };
}
