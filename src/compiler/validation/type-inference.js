// @flow

const { signatures } = require("../AST/signatures");

export function getType(instrs: Array<Instruction>): ?Array<Valtype> {
  if (instrs.length === 0) {
    return;
  }

  const last = instrs[instrs.length - 1];

  // It's a ObjectInstruction
  if (typeof last.object === "string") {
    const opName = `${last.object}.${last.id}`;
    const signature = signatures[opName];

    if (typeof signature === "undefined") {
      throw new Error("Unknow type signature for instruction: " + opName);
    }

    return signature[1];
  }

  // Can't infer it, need to interpreter it
  if (last.id === "get_global" || last.id === "get_local") {
    return;
  }

  if (last.id === "Loop") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    const loop: LoopInstruction = last;

    if (loop.resulttype != null) {
      return [loop.resulttype];
    }
  }

  if (last.id === "If") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    const ifInstruction: IfInstruction = last;

    if (ifInstruction.result != null) {
      return [ifInstruction.result];
    }
  }
}
