// @flow

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * see https://webassembly.github.io/spec/core/valid/instructions.html#constant-expressions
 *
 * TODO(sven): get_global x should check the mutability of x, but we don't have
 * access to the program at this point.
 */
export function isConst(instrs: Array<Instruction>): boolean {
  const last = instrs[instrs.length - 1];

  if (last.id === "const" || last.id === "get_global") {
    return true;
  }

  return false;
}
