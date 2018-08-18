// @flow

import { traverse } from "@webassemblyjs/ast";

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * See https://webassembly.github.io/spec/core/multipage/valid/instructions.html#valid-constant
 */
export default function isConst(
  ast: Program,
  moduleContext: Object
): Array<string> {
  function isConstInstruction(instr): boolean {
    if (instr.id === "const") {
      return true;
    }

    if (instr.id === "get_global") {
      const index = instr.args[0].value;
      return !moduleContext.isMutableGlobal(index);
    }

    // FIXME(sven): this shoudln't be needed, we need to inject our end
    // instructions after the validations
    if (instr.id === "end") {
      return true;
    }

    return false;
  }

  const errors = [];

  traverse(ast, {
    Global(path) {
      const isValid = path.node.init.reduce(
        (acc, instr) => acc && isConstInstruction(instr),
        true
      );
      if (!isValid) {
        errors.push(
          "constant expression required: initializer expression cannot reference mutable global"
        );
      }
    }
  });

  return errors;
}
