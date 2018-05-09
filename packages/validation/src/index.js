// @flow

import funcResultTypeValidate from "./func-result-type";
import mutGlobalValidate from "./mut-global";
import importOrderValidate from "./import-order";

export default function validateAST(ast: Program) {
  const errors = [];

  errors.push(...funcResultTypeValidate(ast));
  errors.push(...mutGlobalValidate(ast));
  errors.push(...importOrderValidate(ast));

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}

export { isConst } from "./is-const";
export { getType, typeEq } from "./type-inference";
