// @flow

import funcResultTypeValidate from "./func-result-type";
import mutGlobalValidate from "./mut-global";

export default function validateAST(ast: Program) {
  const errors = [];

  errors.push(...funcResultTypeValidate(ast));
  errors.push(...mutGlobalValidate(ast));

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}
