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

    if (compact === false) {
      out += "\n";
    }
  });

  out += ")";

  return out;
}

function printModuleImportDescr(n: ImportDescr, depth: number): string {
  let out = "";

  if (n.type === "FuncImportDescr") {
    out += "(";
    out += "func";
    out += space;

    out += printIndex(n.value);

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

  if (n.name != null) {
    out += space;
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
    out += space;
  }

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

  return out;
}

function printInstruction(n: Instruction, depth: number): string {
  let out = "";

  if (n.type === "Instr") {
    out += printGenericInstruction(n, depth + 1);
  }

  if (n.type === "BlockInstruction") {
    out += printBlockInstruction(n, depth + 1);
  }

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

    if (arg.type === "NumberLiteral") {
      out += printNumberLiteral(arg);
    }

    if (arg.type === "Identifier") {
      out += printIdentifier(arg);
    }

    if (arg.type === "ValtypeLiteral") {
      out += arg.name;
    }

    if (arg.type === "Instr") {
      out += printGenericInstruction(arg);
    }
  });

  out += ")";

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

  out += ")";

  return out;
}

function printIdentifier(n: Identifier): string {
  return "$" + n.value;
}

function printIndex(n: Index): string {
  if (n.type === "Identifier") {
    return printIdentifier(n);
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
