// @flow

const compact = false;
const space = " ";
const tab = space + space;
const quote = str => `"${str}"`;

export function printWAST(n: Node): string {
  if (n.type === "Program") {
    return printProgram(n);
  }

  return "()";
}

function printProgram(n: Program): string {
  return n.body.reduce((acc, child) => {
    if (child.type === "Module") {
      acc += printModule(child);
    }

    if (child.type === "Func") {
      acc += printFunc(child);
    }

    if (compact === false) {
      acc += "\n";
    }

    return acc;
  }, "");
}

function printModule(n: Module): string {
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
      out += tab;
    }

    if (field.type === "Func") {
      out += printFunc(field);
    }

    if (field.type === "ModuleExport") {
      out += printModuleExport(field);
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

function printFunc(n: Func): string {
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

    if (typeof param.id === "string") {
      out += "$" + param.id;
    }

    out += space;
    out += param.valtype;

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
    out += tab;
    out += printInstruction(i);

    if (compact === false) {
      out += "\n";
    }
  });

  out += ")";

  return out;
}

function printInstruction(n: Instruction): string {
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

  if (typeof n.max === "number") {
    out += space;
    out += n.max;
  }

  return out;
}
