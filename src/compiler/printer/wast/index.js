// @flow
/* eslint flowtype-errors/show-errors: warn */

const compact = false;
const space = " ";
const quote = str => `"${str}"`;

function indent(nb: number): string {
  return Array(nb)
    .fill(space + space)
    .join("");
}

export function printWAST(n: Node): string {
  if (n.type === "Program") {
    return printProgram(n, 0);
  }

  return "()";
}

function printProgram(n: Program, depth: number): string {
  return n.body.reduce((acc, child) => {
    if (child.type === "Module") {
      acc += printModule(child, depth + 1);
    }

    if (child.type === "Func") {
      acc += printFunc(child, depth + 1);
    }

    if (child.type === "BlockComment") {
      acc += printBlockComment(child, depth + 1);
    }

    if (child.type === "LeadingComment") {
      acc += printLeadingComment(child, depth + 1);
    }

    if (compact === false) {
      acc += "\n";
    }

    return acc;
  }, "");
}

function printModule(n: Module, depth: number): string {
  let out = "(";
  out += "module";

  if (typeof n.id === "string") {
    out += space;
    out += printIdentifier(n.id);
  }

  out += space;

  if (compact === false) {
    out += "\n";
  }

  n.fields.forEach(field => {
    if (compact === false) {
      out += indent(depth);
    }

    if (field.type === "Func") {
      out += printFunc(field, depth + 1);
    }

    if (field.type === "Table") {
      out += printTable(field, depth + 1);
    }

    if (field.type === "Global") {
      out += printGlobal(field, depth + 1);
    }

    if (field.type === "ModuleExport") {
      out += printModuleExport(field);
    }

    if (field.type === "ModuleImport") {
      out += printModuleImport(field);
    }

    if (field.type === "Memory") {
      out += printMemory(field);
    }

    if (field.type === "BlockComment") {
      out += printBlockComment(field, depth + 1);
    }

    if (field.type === "LeadingComment") {
      out += printLeadingComment(field, depth + 1);
    }

    if (compact === false) {
      out += "\n";
    }
  });

  out += ")";

  return out;
}

function printLeadingComment(n: LeadingComment /*, depth: number*/): string {
  // Don't print leading comments in compact mode
  if (compact === true) {
    return "";
  }

  let out = "";

  out += ";;";
  out += n.value;

  out += "\n";

  return out;
}

function printBlockComment(n: BlockComment /*, depth: number*/): string {
  // Don't print block comments in compact mode
  if (compact === true) {
    return "";
  }

  let out = "";

  out += "(;";
  out += n.value;
  out += ";)";

  out += "\n";

  return out;
}

function printModuleImportDescr(n: ImportDescr, depth: number): string {
  let out = "";

  if (n.type === "FuncImportDescr") {
    out += "(";
    out += "func";
    out += space;

    out += printIdentifier(n.id);

    n.params.forEach(param => {
      out += space;
      out += "(";
      out += "param";
      out += space;

      out += printFuncParam(param, depth);
      out += ")";
    });

    n.results.forEach(result => {
      out += space;
      out += "(";
      out += "result";
      out += space;

      out += result;
      out += ")";
    });

    out += ")";
  }

  if (n.type === "GlobalType") {
    out += "(";
    out += "global";
    out += space;

    out += printGlobalType(n, depth);
    out += ")";
  }

  return out;
}

function printModuleImport(n: ModuleImport /*, depth: number*/): string {
  let out = "";

  out += "(";
  out += "import";

  out += space;

  out += quote(n.module);
  out += space;
  out += quote(n.name);

  out += space;
  out += printModuleImportDescr(n.descr);

  out += ")";

  return out;
}

function printGlobalType(n: GlobalType /*, depth: number*/): string {
  let out = "";

  if (n.mutability === "var") {
    out += "(";
    out += "mut";
    out += space;
    out += n.valtype;
    out += ")";
  } else {
    out += n.valtype;
  }

  return out;
}

function printGlobal(n: Global /*, depth: number*/): string {
  let out = "";

  out += "(";
  out += "global";

  out += space;

  if (n.name != null) {
    out += printIdentifier(n.name);
    out += space;
  }

  out += printGlobalType(n.globalType);
  out += space;

  n.init.forEach(i => {
    out += printInstruction(i);
  });

  out += ")";

  return out;
}

function printTable(n: Table /*, depth: number*/): string {
  let out = "";

  out += "(";
  out += "table";

  if (n.name != null) {
    out += space;
    out += printIdentifier(n.name);
  }

  out += space;
  out += printLimit(n.limits);
  out += space;

  out += n.elementType;

  out += ")";

  return out;
}

function printFuncParam(n: FuncParam /*, depth: number*/): string {
  let out = "";

  if (typeof n.id === "string") {
    out += "$" + n.id;
    out += space;
  }

  out += n.valtype;

  return out;
}

function printFunc(n: Func, depth: number): string {
  let out = "";

  out += "(";
  out += "func";

  if (n.name != null) {
    if (n.name.type === "Identifier") {
      out += space;
      out += printIdentifier(n.name);
    }
  }

  n.params.forEach(param => {
    out += space;
    out += "(";
    out += "param";
    out += space;

    out += printFuncParam(param, depth);

    out += ")";
  });

  n.result.forEach(result => {
    out += space;
    out += "(";
    out += "result";

    out += space;
    out += result;

    out += ")";
  });

  if (n.body.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    n.body.forEach(i => {
      out += indent(depth);
      out += printInstruction(i, depth);

      if (compact === false) {
        out += "\n";
      }
    });

    out += indent(depth - 1) + ")";
  } else {
    out += ")";
  }

  return out;
}

function printInstruction(n: Instruction, depth: number): string {
  let out = "";

  if (n.type === "Instr") {
    out += printGenericInstruction(n, depth + 1);
  } else if (n.type === "BlockInstruction") {
    out += printBlockInstruction(n, depth + 1);
  } else if (n.type === "IfInstruction") {
    out += printIfInstruction(n, depth + 1);
  } else if (n.type === "CallInstruction") {
    out += printCallInstruction(n, depth + 1);
  } else if (n.type === "LoopInstruction") {
    out += printLoopInstruction(n, depth + 1);
  } else {
    throw new Error("Unsupported instruction: " + n.type);
  }

  return out;
}

function printLoopInstruction(n: LoopInstruction, depth: number): string {
  let out = "";

  out += "(";
  out += "loop";

  if (n.label != null) {
    out += space;
    out += printIdentifier(n.label);
  }

  if (typeof n.resulttype === "string") {
    out += space;

    out += "(";
    out += "result";
    out += space;

    out += n.resulttype;
    out += ")";
  }

  if (n.instr.length > 0) {
    n.instr.forEach(e => {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(e, depth + 1);
    });

    if (compact === false) {
      out += "\n";
      out += indent(depth - 1);
    }
  }

  out += ")";

  return out;
}

function printCallInstruction(n: CallInstruction /*, depth: number*/): string {
  let out = "";

  out += "(";
  out += "call";

  out += space;

  out += printIndex(n.index);

  out += ")";

  return out;
}

function printIfInstruction(n: IfInstruction, depth: number): string {
  let out = "";

  out += "(";
  out += "if";

  if (n.testLabel != null) {
    out += space;
    out += printIdentifier(n.testLabel);
  }

  if (typeof n.result === "string") {
    out += space;

    out += "(";
    out += "result";
    out += space;

    out += n.result;
    out += ")";
  }

  if (n.test.length > 0) {
    out += space;

    n.test.forEach(i => {
      out += printInstruction(i, depth + 1);
    });
  }

  if (n.consequent.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    out += indent(depth);
    out += "(";
    out += "then";

    depth++;

    n.consequent.forEach(i => {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });

    depth--;

    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += ")";
  } else {
    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += "(";
    out += "then";
    out += ")";
  }

  if (n.alternate.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    out += indent(depth);
    out += "(";
    out += "else";

    depth++;

    n.alternate.forEach(i => {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });

    depth--;

    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += ")";
  } else {
    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += "(";
    out += "else";
    out += ")";
  }

  if (compact === false) {
    out += "\n";
    out += indent(depth - 1);
  }

  out += ")";

  return out;
}

function printBlockInstruction(n: BlockInstruction, depth: number): string {
  let out = "";

  out += "(";
  out += "block";

  if (n.label != null) {
    out += space;
    out += printIdentifier(n.label);
  }

  if (n.instr.length > 0) {
    n.instr.forEach(i => {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });

    if (compact === false) {
      out += "\n";
    }

    out += indent(depth - 1);
    out += ")";
  } else {
    out += ")";
  }

  return out;
}

function printGenericInstruction(
  n: GenericInstruction /*, depth: number*/
): string {
  let out = "";

  out += "(";

  if (typeof n.object === "string") {
    out += n.object;
    out += ".";
  }

  out += n.id;

  n.args.forEach(arg => {
    out += space;
    out += printFuncInstructionArg(arg);
  });

  out += ")";

  return out;
}

function printFuncInstructionArg(n: Object): string {
  let out = "";

  if (n.type === "NumberLiteral") {
    out += printNumberLiteral(n);
  }

  if (n.type === "Identifier") {
    out += printIdentifier(n);
  }

  if (n.type === "ValtypeLiteral") {
    out += n.name;
  }

  if (n.type === "Instr") {
    out += printGenericInstruction(n);
  }

  return out;
}

function printNumberLiteral(n: NumberLiteral): string {
  return n.value + "";
}

function printModuleExport(n: ModuleExport): string {
  let out = "";

  out += "(";
  out += "export";

  out += space;
  out += quote(n.name);

  if (n.descr.type === "Func") {
    out += space;
    out += "(";
    out += "func";
    out += space;

    out += printIndex(n.descr.id);

    out += ")";
  }

  if (n.descr.type === "Mem") {
    out += space;
    out += "(";
    out += "memory";
    out += space;
    out += printIndex(n.descr.id);
    out += ")";
  }

  out += ")";

  return out;
}

function printIdentifier(n: Identifier): string {
  return "$" + n.value;
}

function printIndex(n: Index): string {
  if (n.type === "Identifier") {
    return printIdentifier(n);
  } else if (n.type === "NumberLiteral") {
    return printNumberLiteral(n);
  } else {
    throw new Error("Unsupported index: " + n.type);
  }
}

function printMemory(n: Memory): string {
  let out = "";
  out += "(";
  out += "memory";

  if (n.id != null) {
    out += space;
    out += printIndex(n.id);
    out += space;
  }

  out += printLimit(n.limits);

  out += ")";

  return out;
}

function printLimit(n: Limit): string {
  let out = "";

  out += n.min + "";

  if (n.max != null) {
    out += space;
    out += n.max;
  }

  return out;
}
