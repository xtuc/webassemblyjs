// @flow

import { kStart } from "./index";

function printInstruction(instruction: Instruction): string {
  let out = "";

  if (typeof instruction.type === "string") {
    // $FlowIgnore
    if (instruction.type === "InternalEndAndReturn") {
      out += "_end_and_return";
    }

    // $FlowIgnore
    if (instruction.type === "InternalBrUnless") {
      out += "_br_unless";
      out += " " + instruction.target;
    }

    // $FlowIgnore
    if (instruction.type === "InternalGoto") {
      out += "_goto";
      out += " " + instruction.target;
    }

    // $FlowIgnore
    if (instruction.type === "InternalCallExtern") {
      out += "_extern_call";
      out += " " + instruction.target;
    }
  }

  if (typeof instruction.object === "string") {
    out += instruction.object;
    out += ".";
  }

  if (typeof instruction.id === "string") {
    out += instruction.id;
  }

  if (instruction.args !== undefined) {
    // $FlowIgnore
    instruction.args.forEach(arg => {
      out += " ";
      // $FlowIgnore
      out += arg.value;
    });
  }

  if (typeof instruction.index === "object") {
    // $FlowIgnore
    out += " @" + String(instruction.index.value);
  }

  return out;
}

export function dumpIR(ir: IR): string {
  let out = "";

  out += "Func table:\n";

  ir.funcTable.forEach(func => {
    if (func.name === kStart) {
      out += "__start" + " at " + func.startAt + "\n";
      return;
    }

    out += func.name + " at " + func.startAt + "\n";
  });

  out += "\n";

  for (const offset in ir.program) {
    out += offset + " | ";
    out += printInstruction(ir.program[parseInt(offset)]);
    out += "\n";
  }

  return out;
}
