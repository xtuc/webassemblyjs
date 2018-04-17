// @flow

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * See https://webassembly.github.io/spec/core/multipage/valid/instructions.html#valid-constant
 *
 * TODO(sven): get_global x should check the mutability of x, but we don't have
 * access to the program at this point.
 */
export function isConst(instrs: Array<Instruction>): boolean {
  if (instrs.length === 0) {
    return false;
  }

  return instrs.reduce((acc, instr) => {
    // Bailout
    if (acc === false) {
      return acc;
    }

    if (instr.id === "const") {
      return true;
    }

    if (instr.id === "get_global") {
      return true;
    }

    // FIXME(sven): this shoudln't be needed, we need to inject our end
    // instructions after the validations
    if (instr.id === "end") {
      return true;
    }

    return false;
  }, true);
}
