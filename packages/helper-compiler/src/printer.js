// @flow

function printInstruction(instruction: Instruction): string {
  let out = "";

  if (instruction.type === "InternalBrUnless") {
    out += "_br_unless";
    out += " " + instruction.target;
  }

  if (instruction.type === "InternalGoto") {
    out += "_goto";
    out += " " + instruction.target;
  }

  if (typeof instruction.object === "string") {
    out += instruction.object;
    out += ".";
  }

  if (typeof instruction.id === "string") {
    out += instruction.id;
  }

  if (typeof instruction.args === "object") {
    instruction.args.forEach(arg => {
      out += " ";
      out += arg.value;
    });
  }

  if (typeof instruction.index === "object") {
    out += " @" + instruction.index.value;
  }

  return out;
}

export function dumpIR(ir: IR): string {
  let out = "";

  out += "Func table:\n";

  ir.funcTable.forEach(func => {
    out += func.name + " at " + func.startAt + "\n";
  });

  out += "\n";

  for (const offset in ir.program) {
    out += offset + " | ";
    out += printInstruction(ir.program[offset]);
    out += "\n";
  }

  return out;
}
