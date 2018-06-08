// @flow

import importOrderValidate from "./import-order";
import isConst from "./is-const";
import typeChecker from "./type-checker";
import { moduleContextFromModuleAST } from "@webassemblyjs/helper-module-context";

export default function validateAST(ast: Program) {
  const errors = getValidationErrors(ast);

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}

export function getValidationErrors(ast: Program): Array<string> {
  const errors = [];

  ast.body.filter(({ type }) => type === "Module").forEach(m => {
    const moduleContext = moduleContextFromModuleAST(m);

    errors.push(...isConst(ast, moduleContext));
    errors.push(...importOrderValidate(ast));
    errors.push(...typeChecker(ast, moduleContext));
  });

  return errors;
}

export { getType, typeEq } from "./type-inference";
export { isConst };

export const stack = typeChecker;
