// @flow

export function getType(instrs: Array<Instruction>): ?string {
  if (instrs.length === 0) {
    return;
  }

  const last = instrs[instrs.length - 1];

  if (typeof last.object === "string") {
    return last.object;
  }

  if (last.id === "Loop" && last.resulttype != null) {
    return last.resulttype;
  }
}
