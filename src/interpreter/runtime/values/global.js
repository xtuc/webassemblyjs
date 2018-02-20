// @flow

const { evaluate } = require("../../partial-evaluation");
const { isConst } = require("../../../compiler/validation/is-const");
const {
  getType,
  typeEq
} = require("../../../compiler/validation/type-inference");
const { CompileError } = require("../../../errors");

export function createInstance(
  allocator: Allocator,
  node: Global
): GlobalInstance {
  let value;
  const { valtype, mutability } = node.globalType;

  if (node.init.length > 0 && isConst(node.init) === false) {
    throw new CompileError("constant expression required");
  }

  // None or multiple constant expressions in the initializer seems not possible
  // TODO(sven): find a specification reference for that
  if (node.init.length > 1 || node.init.length === 0) {
    throw new CompileError("type mismatch");
  }

  // Validate the type
  const resultInferedType = getType(node.init);

  if (
    resultInferedType != null &&
    typeEq([node.globalType.valtype], resultInferedType) === false
  ) {
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
