// @flow

import importOrderValidate from "./import-order";
import typeChecker from "./type-checker";

export default function validateAST(ast: Program) {
  const errors = [];

  errors.push(...importOrderValidate(ast));
  errors.push(...typeChecker(ast));

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}

export { isConst } from "./is-const";
export { getType, typeEq } from "./type-inference";

export const stack = typeChecker;
