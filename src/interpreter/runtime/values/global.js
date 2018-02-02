// @flow

const { evaluate } = require("../../partial-evaluation");
const { isConst } = require("../../../compiler/validation/is-const");
const { getType } = require("../../../compiler/validation/type-inference");
const { CompileError } = require("../../../errors");

export function createInstance(allocator: Allocator, node: Global) {
  let value;
  const { valtype, mutability } = node.globalType;

  if (isConst(node.init) === false) {
    throw new CompileError("constant expression required");
  }

  // Validate the type
  const resultInferedType = getType(node.init);

  if (node.globalType.valtype !== resultInferedType) {
    throw new CompileError("type mismatch");
  }

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
