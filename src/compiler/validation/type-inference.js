// @flow

const { signatures } = require("../AST/signatures");

export function typeEq(l: Array<Valtype>, r: Array<Valtype>): boolean {
  if (l.length !== r.length) {
    return false;
  }

  for (let i = 0; i < l.length; i++) {
    if (l[i] != r[i]) {
      return false;
    }
  }

  return true;
}

export function getType(instrs: Array<Instruction>): ?Array<Valtype> {
  if (instrs.length === 0) {
    return;
  }

  const last = instrs[instrs.length - 1];

  // It's a ObjectInstruction
  if (typeof last.object === "string") {
    // $FlowIgnore
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

  if (last.type === "LoopInstruction") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    const loop: LoopInstruction = last;

    if (loop.resulttype != null) {
      return [loop.resulttype];
    }
  }

  if (last.type === "IfInstruction") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    const ifInstruction: IfInstruction = last;

    let res = [];

    // The type is known
    if (typeof ifInstruction.result === "string") {
      res = [ifInstruction.result];
    }

    // Continue on the branches
    const leftType = getType(ifInstruction.consequent) || [];
    const rightType = getType(ifInstruction.alternate) || [];

    if (typeEq(leftType, res) === false || typeEq(rightType, res) === false) {
      throw new Error("type mismatch in if branches");
    }

    return res;
  }
}
