// @flow

export function isConst(instrs: Array<Instruction>): boolean {
  if (instrs.length === 0) {
    return false;
  }

  const last = instrs[instrs.length - 1];

  if (last.id === "const") {
    return true;
  }

  return false;
}
