// @flow

import { signatures } from "./signatures";
export {
  module,
  moduleMetadata,
  functionNameMetadata,
  moduleNameMetadata,
  localNameMetadata,
  quoteModule,
  binaryModule,
  sectionMetadata,
  loopInstruction,
  instruction,
  ifInstruction,
  longNumberLiteral,
  stringLiteral,
  floatLiteral,
  indexInFuncSection,
  elem,
  start,
  typeInstruction,
  leadingComment,
  blockComment,
  globalType,
  global,
  data,
  memory,
  table,
  moduleImport,
  program,
  callInstruction,
  blockInstruction,
  identifier,
  byteArray,
  //TODO: fix these inconsistent names
  valtypeLiteral as valtype,
  limit as limits
} from "./constructorFunctions";

import {
  signature as functionSignature,
  moduleExportDescr,
  longNumberLiteral,
  floatLiteral,
  // TODO: this is only being aliased to avoid a naming collision with the current numberLiteral constructor
  // function. Ideally, the numberLiteral function would be renamed to indicate that it is a utility function
  // with additional business logic
  numberLiteral as numberLiteralConstructor
} from "./constructorFunctions";

const {
  parse32F,
  parse64F,
  parse32I,
  parse64I,
  parseU32,
  isNanLiteral,
  isInfLiteral
} = require("@webassemblyjs/wast-parser/lib/number-literals");

function assert(cond: boolean) {
  if (!cond) {
    throw new Error("assertion error");
  }
}

export function signature(object: string, name: string): SignatureMap {
  let opcodeName = name;
  if (object !== undefined && object !== "") {
    opcodeName = object + "." + name;
  }
  const sign = signatures[opcodeName];
  if (sign == undefined) {
    // TODO: Uncomment this when br_table and others has been done
    //throw new Error("Invalid opcode: "+opcodeName);
    return [object, object];
  }

  return sign[0];
}

export function moduleExport(
  name: string,
  exportType: ExportDescrType,
  id: Index
): ModuleExport {
  return {
    type: "ModuleExport",
    name,
    descr: moduleExportDescr(exportType, id)
  };
}

export function func(
  name: ?Index,
  params: Array<FuncParam>,
  results: Array<Valtype>,
  body: Array<Instruction>
): Func {
  assert(typeof params === "object" && typeof params.length !== "undefined");
  assert(typeof results === "object" && typeof results.length !== "undefined");
  assert(typeof body === "object" && typeof body.length !== "undefined");
  assert(typeof name !== "string");

  return {
    type: "Func",
    name,
    signature: functionSignature(params, results),
    body
  };
}

export function funcWithTypeRef(
  name: ?Index,
  typeRef: Index,
  body: Array<Instruction>
): Func {
  assert(typeof body === "object" && typeof body.length !== "undefined");
  assert(typeof name !== "string");

  return {
    type: "Func",
    name,
    signature: typeRef,
    body
  };
}

export function objectInstruction(
  id: string,
  object: Valtype,
  args: Array<Expression> = [],
  namedArgs: Object = {}
): ObjectInstruction {
  assert(typeof args === "object" && typeof args.length !== "undefined");
  assert(typeof object === "string");

  const n: ObjectInstruction = {
    type: "Instr",
    id,
    object,
    args
  };

  if (Object.keys(namedArgs).length !== 0) {
    n.namedArgs = namedArgs;
  }

  return n;
}

export function numberLiteral(
  rawValue: number | string,
  instructionType: Valtype = "i32"
): NumericLiteral {
  const original = rawValue;

  // Remove numeric separators _
  if (typeof rawValue === "string") {
    rawValue = rawValue.replace(/_/g, "");
  }

  if (typeof rawValue === "number") {
    return numberLiteralConstructor(rawValue, String(original));
  } else {
    switch (instructionType) {
      case "i32": {
        return numberLiteralConstructor(parse32I(rawValue), String(original));
      }
      case "u32": {
        return numberLiteralConstructor(parseU32(rawValue), String(original));
      }
      case "i64": {
        return longNumberLiteral(parse64I(rawValue), String(original));
      }
      case "f32": {
        return floatLiteral(
          parse32F(rawValue),
          isNanLiteral(rawValue),
          isInfLiteral(rawValue),
          String(original)
        );
      }
      // f64
      default: {
        return floatLiteral(
          parse64F(rawValue),
          isNanLiteral(rawValue),
          isInfLiteral(rawValue),
          String(original)
        );
      }
    }
  }
}

export function getUniqueNameGenerator(): string => string {
  const inc = {};
  return function(prefix: string = "temp"): string {
    if (!(prefix in inc)) {
      inc[prefix] = 0;
    } else {
      inc[prefix] = inc[prefix] + 1;
    }
    return prefix + "_" + inc[prefix];
  };
}

/**
 * Decorators
 */

export function withLoc(n: Node, end: Position, start: Position): Node {
  const loc = {
    start,
    end
  };

  n.loc = loc;

  return n;
}

export function withRaw(n: Node, raw: string): Node {
  // $FlowIgnore
  n.raw = raw;

  return n;
}

/**
 * Import
 */

export function globalImportDescr(
  valtype: Valtype,
  mutability: Mutability
): GlobalType {
  return {
    type: "GlobalType",

    valtype,
    mutability
  };
}

export function funcParam(valtype: Valtype, id: ?string): FuncParam {
  return {
    id,
    valtype
  };
}

// TODO: remove this
export function funcImportDescr(
  id: Identifier,
  params: Array<FuncParam> = [],
  results: Array<Valtype> = []
): FuncImportDescr {
  assert(typeof params === "object" && typeof params.length !== "undefined");
  assert(typeof results === "object" && typeof results.length !== "undefined");

  return {
    type: "FuncImportDescr",
    id,
    signature: functionSignature(params, results)
  };
}

export function indexLiteral(value: number | string): Index {
  // $FlowIgnore
  const x: NumberLiteral = numberLiteral(value, "u32");

  return x;
}

export function memIndexLiteral(value: number): Memidx {
  // $FlowIgnore
  const x: U32Literal = numberLiteral(value, "u32");
  return x;
}

export function typeInstructionFunc(
  params: Array<FuncParam> = [],
  results: Array<Valtype> = [],
  id: ?Index
): TypeInstruction {
  return {
    type: "TypeInstruction",
    id,
    functype: functionSignature(params, results)
  };
}

export function callIndirectInstruction(
  params: Array<FuncParam>,
  results: Array<Valtype>,
  intrs: Array<Expression>
): CallIndirectInstruction {
  return {
    type: "CallIndirectInstruction",
    signature: functionSignature(params, results),
    intrs
  };
}

export function callIndirectInstructionWithTypeRef(
  typeRef: Index,
  intrs: Array<Expression>
): CallIndirectInstruction {
  return {
    type: "CallIndirectInstruction",
    signature: typeRef,
    intrs
  };
}

export function isAnonymous(ident: Identifier): boolean {
  return ident.raw === "";
}

export { traverse, traverseWithHooks } from "./traverse";
export { signatures } from "./signatures";
export {
  isInstruction,
  getSectionMetadata,
  sortSectionMetadata,
  orderedInsertNode,
  assertHasLoc,
  getEndOfSection,
  shiftSection,
  shiftLoc
} from "./utils";
export { cloneNode } from "./clone";
