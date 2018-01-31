// @flow

const { evaluate } = require("../../partial-evaluation");
const { isConst } = require("../../../compiler/validation/is-const");
const { CompileError } = require("../../../errors");

export function createInstance(allocator: Allocator, node: Global) {
  let value;
  const { valtype, mutability } = node.globalType;

  if (node.init.length > 0) {
    if (isConst(node.init) === false) {
      throw new CompileError("constant expression required");
    }

    const res = evaluate(allocator, node.init);

    if (res != null) {
      value = res.value;
    }
  }

  return {
    type: valtype,
    mutability,
    value
  };
}
