// @flow

export function isConst(instrs: Array<Instruction>): boolean {
  const last = instrs[instrs.length - 1];

  if (last.id === "const") {
    return true;
  }

  return false;
}
