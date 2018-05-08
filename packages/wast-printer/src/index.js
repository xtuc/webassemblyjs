// @flow
import Long from "long";
import { isAnonymous } from "@webassemblyjs/ast";

const compact = false;
const space = " ";
const quote = str => `"${str}"`;

function indent(nb: number): string {
  return Array(nb)
    .fill(space + space)
    .join("");
}

// TODO(sven): allow arbitrary ast nodes
export function print(n: Node): string {
  if (n.type === "Program") {
    return printProgram(n, 0);
  } else {
    throw new Error("Unsupported node in print of type: " + String(n.type));
  }
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
      acc += printBlockComment(child);
    }

    if (child.type === "LeadingComment") {
      acc += printLeadingComment(child);
    }

    if (compact === false) {
      acc += "\n";
    }

    return acc;
  }, "");
}

function printTypeInstruction(n: TypeInstruction): string {
  let out = "";

  out += "(";
  out += "type";

  out += space;

  if (n.id != null) {
    out += printIndex(n.id);
    out += space;
  }

  out += "(";
  out += "func";

  n.functype.params.forEach(param => {
    out += space;
    out += "(";
    out += "param";
    out += space;

    out += printFuncParam(param);

    out += ")";
  });

  n.functype.results.forEach(result => {
    out += space;
    out += "(";
    out += "result";
    out += space;

    out += result;
    out += ")";
  });

  out += ")"; // func

  out += ")";

  return out;
}

function printModule(n: Module, depth: number): string {
  let out = "(";
  out += "module";

  if (typeof n.id === "string") {
    out += space;
    out += n.id;
  }

  if (compact === false) {
    out += "\n";
  } else {
    out += space;
  }

  n.fields.forEach(field => {
    if (compact === false) {
      out += indent(depth);
    }

    switch (field.type) {
      case "Func": {
        out += printFunc(field, depth + 1);
        break;
      }

      case "TypeInstruction": {
        out += printTypeInstruction(field);
        break;
      }

      case "Table": {
        out += printTable(field);
        break;
      }

      case "Global": {
        out += printGlobal(field, depth + 1);
        break;
      }

      case "ModuleExport": {
        out += printModuleExport(field);
        break;
      }

      case "ModuleImport": {
        out += printModuleImport(field);
        break;
      }

      case "Memory": {
        out += printMemory(field);
        break;
      }

      case "BlockComment": {
        out += printBlockComment(field);
        break;
      }

      case "LeadingComment": {
        out += printLeadingComment(field);
        break;
      }

      case "Start": {
        out += printStart(field);
        break;
      }

      case "Elem": {
        out += printElem(field, depth);
        break;
      }

      case "Data": {
        out += printData(field, depth);
        break;
      }

      default:
        throw new Error(
          "Unsupported node in printModule: " + String(field.type)
        );
    }

    if (compact === false) {
      out += "\n";
    }
  });

  out += ")";

  return out;
}

function printData(n: Data, depth: number): string {
  let out = "";

  out += "(";
  out += "data";
  out += space;

  out += printIndex(n.memoryIndex);
  out += space;

  out += printInstruction(n.offset, depth);
  out += space;

  out += '"';

  n.init.values.forEach(byte => {
    out += String.fromCharCode(byte);
  });

  out += '"';

  out += ")";

  return out;
}

function printElem(n: Elem, depth: number): string {
  let out = "";

  out += "(";
  out += "elem";

  out += space;
  out += printIndex(n.table);

  const [firstOffset] = n.offset;

  out += space;

  out += "(";
  out += "offset";
  out += space;

  out += printInstruction(firstOffset, depth);
  out += ")";

  n.funcs.forEach(func => {
    out += space;
    out += printIndex(func);
  });

  out += ")";

  return out;
}

function printStart(n: Start): string {
  let out = "";

  out += "(";
  out += "start";
  out += space;
  out += printIndex(n.index);
  out += ")";

  return out;
}

function printLeadingComment(n: LeadingComment): string {
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

function printBlockComment(n: BlockComment): string {
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

function printSignature(n: Signature): string {
  let out = "";

  n.params.forEach(param => {
    out += space;
    out += "(";
    out += "param";
    out += space;

    out += printFuncParam(param);
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

  return out;
}

function printModuleImportDescr(n: ImportDescr): string {
  let out = "";

  if (n.type === "FuncImportDescr") {
    out += "(";
    out += "func";

    if (isAnonymous(n.id) === false) {
      out += space;
      out += printIdentifier(n.id);
    }

    out += printSignature(n.signature);

    out += ")";
  }

  if (n.type === "GlobalType") {
    out += "(";
    out += "global";
    out += space;

    out += printGlobalType(n);
    out += ")";
  }

  if (n.type === "Table") {
    out += printTable(n);
  }

  return out;
}

function printModuleImport(n: ModuleImport): string {
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

function printGlobalType(n: GlobalType): string {
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

function printGlobal(n: Global, depth: number): string {
  let out = "";

  out += "(";
  out += "global";
  out += space;

  if (n.name != null && isAnonymous(n.name) === false) {
    out += printIdentifier(n.name);
    out += space;
  }

  out += printGlobalType(n.globalType);
  out += space;

  n.init.forEach(i => {
    out += printInstruction(i, depth + 1);
  });

  out += ")";

  return out;
}

function printTable(n: Table): string {
  let out = "";

  out += "(";
  out += "table";
  out += space;

  if (n.name != null && isAnonymous(n.name) === false) {
    out += printIdentifier(n.name);
    out += space;
  }

  out += printLimit(n.limits);
  out += space;

  out += n.elementType;

  out += ")";

  return out;
}

function printFuncParam(n: FuncParam): string {
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
    if (n.name.type === "Identifier" && isAnonymous(n.name) === false) {
      out += space;
      out += printIdentifier(n.name);
    }
  }

  if (n.signature.type === "Signature") {
    out += printSignature(n.signature);
  } else {
    const index = (n.signature: Index);
    out += space;
    out += "(";
    out += "type";
    out += space;

    out += printIndex(index);

    out += ")";
  }

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
  switch (n.type) {
    case "Instr":
      // $FlowIgnore
      return printGenericInstruction(n);

    case "BlockInstruction":
      // $FlowIgnore
      return printBlockInstruction(n, depth + 1);

    case "IfInstruction":
      // $FlowIgnore
      return printIfInstruction(n, depth + 1);

    case "CallInstruction":
      // $FlowIgnore
      return printCallInstruction(n, depth + 1);

    case "CallIndirectInstruction":
      // $FlowIgnore
      return printCallIndirectIntruction(n, depth + 1);

    case "LoopInstruction":
      // $FlowIgnore
      return printLoopInstruction(n, depth + 1);

    default:
      throw new Error("Unsupported instruction: " + JSON.stringify(n.type));
  }
}

function printCallIndirectIntruction(
  n: CallIndirectInstruction,
  depth: number
): string {
  let out = "";

  out += "(";
  out += "call_indirect";

  if (n.signature.type === "Signature") {
    out += printSignature(n.signature);
  } else if (n.signature.type === "Identifier") {
    out += space;

    out += "(";
    out += "type";

    out += space;
    out += printIdentifier(n.signature);

    out += ")";
  } else {
    throw new Error(
      "CallIndirectInstruction: unsupported signature " +
        JSON.stringify(n.signature.type)
    );
  }

  out += space;

  if (n.intrs != null) {
    // $FlowIgnore
    n.intrs.forEach((i, index) => {
      // $FlowIgnore
      out += printInstruction(i, depth + 1);

      // $FlowIgnore
      if (index !== n.intrs.length - 1) {
        out += space;
      }
    });
  }

  out += ")";

  return out;
}

function printLoopInstruction(n: LoopInstruction, depth: number): string {
  let out = "";

  out += "(";
  out += "loop";

  if (n.label != null && isAnonymous(n.label) === false) {
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

  if (n.testLabel != null && isAnonymous(n.testLabel) === false) {
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

  if (n.label != null && isAnonymous(n.label) === false) {
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

function printGenericInstruction(n: GenericInstruction): string {
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

function printLongNumberLiteral(n: LongNumberLiteral): string {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  const { low, high } = n.value;

  const v = new Long(low, high);

  return v.toString();
}

function printFloatLiteral(n: FloatLiteral): string {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  return String(n.value);
}

function printFuncInstructionArg(n: Object): string {
  let out = "";

  if (n.type === "NumberLiteral") {
    out += printNumberLiteral(n);
  }

  if (n.type === "LongNumberLiteral") {
    out += printLongNumberLiteral(n);
  }

  if (n.type === "Identifier" && isAnonymous(n) === false) {
    out += printIdentifier(n);
  }

  if (n.type === "ValtypeLiteral") {
    out += n.name;
  }

  if (n.type === "FloatLiteral") {
    out += printFloatLiteral(n);
  }

  if (n.type === "Instr") {
    out += printGenericInstruction(n);
  }

  return out;
}

function printNumberLiteral(n: NumberLiteral): string {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  return String(n.value);
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
    out += String(n.max);
  }

  return out;
}
