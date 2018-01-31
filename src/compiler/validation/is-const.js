// @flow

export function isConst(instrs: Array<Instruction>): boolean {
  const [last] = instrs;

  if (last.id === "const") {
    return true;
  }

  return false;
}
