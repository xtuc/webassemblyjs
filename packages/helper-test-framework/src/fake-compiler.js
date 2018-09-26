// @flow

import { instruction } from "@webassemblyjs/ast";
import { listOfInstructionsToIr } from "@webassemblyjs/helper-compiler";

export function addFakeLocsListOfInstructions(instrs) {
  const loc = x => ({
    start: {
      byteOffset: x,
      column: -1,
      line: -1
    },
    end: {
      byteOffset: x + 1,
      column: -1,
      line: -1
    }
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
