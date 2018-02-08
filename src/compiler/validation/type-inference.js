// @flow

export function getType(instrs: Array<Instruction>): ?string {
  if (instrs.length === 0) {
    return;
  }

  const last = instrs[instrs.length - 1];

  if (typeof last.object === "string") {
    return last.object;
  }

  // Can't infer it, need to interpreter it
  if (last.id === "get_global") {
    return;
  }

  if (last.id === "Loop") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    const loop: LoopInstruction = last;

    if (loop.resulttype != null) {
      return loop.resulttype;
    }
  }
}
