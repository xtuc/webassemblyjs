// @flow

import { instruction } from "@webassemblyjs/ast";
import { listOfInstructionsToIr } from "@webassemblyjs/helper-compiler";

export function addFakeLocsListOfInstructions(instrs: Array<Object>) {
  const loc = (x) => ({
    start: {
      column: x,
      line: -1,
    },
    end: {
      column: x + 1,
      line: -1,
    },
  });

  instrs.forEach((instr, index) => {
    instr.loc = loc(index);
  });
}

export function compileASTNodes(nodes: Array<Node>): IR {
  nodes.push(instruction("end"));
  addFakeLocsListOfInstructions(nodes);

  return listOfInstructionsToIr(nodes);
}
