// @flow

const {
  parse32F,
  parse64F,
  parse32I,
  parse64I,
  parseU32,
  isNanLiteral,
  isInfLiteral
} = require("@webassemblyjs/wast-parser/lib/number-literals");

const { signatures } = require("./signatures");

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

export function moduleNameMetadata(value: string): ModuleNameMetadata {
  return {
    type: "ModuleNameMetadata",
    value
  };
}

export function functionNameMetadata(
  value: string,
  index: number
): FunctionNameMetadata {
  return {
    type: "FunctionNameMetadata",
    value,
    index
  };
}

export function localNameMetadata(
  value: string,
  localIndex: number,
  functionIndex: number
): LocalNameMetadata {
  return {
    type: "LocalNameMetadata",
    value,
    localIndex,
    functionIndex
  };
}

export function moduleMetadata(
  sections: Array<SectionMetadata>,
  functionNames: Array<FunctionNameMetadata>,
  localNames: Array<LocalNameMetadata>
): ModuleMetadata {
  const n: ModuleMetadata = {
    type: "ModuleMetadata",
    sections
  };
  if (functionNames.length) {
    n.functionNames = functionNames;
  }
  if (localNames.length) {
    n.localNames = localNames;
  }
  return n;
}

export function identifier(value: string): Identifier {
  return {
    type: "Identifier",
    value
  };
}

export function valtype(name: Valtype): ValtypeLiteral {
  return {
    type: "ValtypeLiteral",
    name
  };
}

export function stringLiteral(value: string): StringLiteral {
  return {
    type: "StringLiteral",
    value
  };
}

export function program(body: Array<Node>): Program {
  return {
    type: "Program",
    body
  };
}

export function module(
  id: ?string,
  fields: ModuleFields,
  metadata?: ModuleMetadata
): Module {
  if (id != null) {
    assert(typeof id === "string");
  }

  assert(typeof fields === "object" && typeof fields.length !== "undefined");

  const n: Module = {
    type: "Module",
    id,
    fields
  };

  if (typeof metadata !== "undefined") {
    n.metadata = metadata;
  }

  return n;
}

export function sectionMetadata(
  section: SectionName,
  startOffset: number,
  size: NumberLiteral,
  // $FlowIgnore
  vectorOfSize: NumberLiteral = numberLiteral(-1)
): SectionMetadata {
  assert(size.type === "NumberLiteral");
  assert(vectorOfSize.type === "NumberLiteral");

  return {
    type: "SectionMetadata",
    section,
    startOffset,
    size,
    vectorOfSize
  };
}

export function binaryModule(id: ?string, blob: Array<string>): BinaryModule {
  return {
    type: "BinaryModule",
    blob,
    id,
    fields: []
  };
}

export function quoteModule(id: ?string, string: Array<string>): QuoteModule {
  return {
    type: "QuoteModule",
    string,
    id,
    fields: []
  };
}

export function moduleExport(
  name: string,
  type: ExportDescr,
  id: Index
): ModuleExport {
  return {
    type: "ModuleExport",
    name,
    descr: {
      type,
      id
    }
  };
}

export function functionSignature(
  params: Array<FuncParam>,
  results: Array<Valtype>
): Signature {
  return {
    type: "Signature",
    params,
    results
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

export function instruction(
  id: string,
  args: Array<Expression> = [],
  namedArgs: Object = {}
): GenericInstruction {
  assert(typeof args === "object" && typeof args.length !== "undefined");
  assert(id !== "block");
  assert(id !== "if");
  assert(id !== "loop");

  const n: GenericInstruction = {
    type: "Instr",
    id,
    args
  };

  if (Object.keys(namedArgs).length !== 0) {
    n.namedArgs = namedArgs;
  }

  return n;
}

export function loopInstruction(
  label: Identifier,
  resulttype: ?Valtype,
  instr: Array<Instruction>
): LoopInstruction {
  assert(label !== null);
  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  return {
    type: "LoopInstruction",
    id: "loop",
    label,
    resulttype,
    instr
  };
}

export function blockInstruction(
  label: Identifier,
  instr: Array<Instruction>,
  result: ?Valtype
): BlockInstruction {
  assert(typeof label !== "undefined");
  assert(typeof label.type === "string");
  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  return {
    type: "BlockInstruction",
    id: "block",
    label,
    instr,
    result
  };
}

export function numberLiteral(
  rawValue: number | string,
  instructionType: Valtype = "i32"
): NumericLiteral {
  let value;
  let nan = false;
  let inf = false;
  let type = "NumberLiteral";
  const original = rawValue;

  // Remove numeric separators _
  if (typeof rawValue === "string") {
    rawValue = rawValue.replace(/_/g, "");
  }

  if (typeof rawValue === "number") {
    value = rawValue;
  } else {
    switch (instructionType) {
      case "i32": {
        value = parse32I(rawValue);
        break;
      }
      case "u32": {
        value = parseU32(rawValue);
        break;
      }
      case "i64": {
        type = "LongNumberLiteral";
        value = parse64I(rawValue);
        break;
      }
      case "f32": {
        type = "FloatLiteral";
        value = parse32F(rawValue);
        nan = isNanLiteral(rawValue);
        inf = isInfLiteral(rawValue);
        break;
      }
      // f64
      default: {
        type = "FloatLiteral";
        value = parse64F(rawValue);
        nan = isNanLiteral(rawValue);
        inf = isInfLiteral(rawValue);
        break;
      }
    }
  }

  // This is a hack to avoid rewriting all tests to have a "isnan: false" field
  // $FlowIgnore: this is correct, but flow doesn't like mutations like this
  const x: NumericLiteral = {
    type,
    value
  };

  if (nan === true) {
    // $FlowIgnore
    x.nan = true;
  }

  if (inf === true) {
    // $FlowIgnore
    x.inf = true;
  }

  x.raw = String(original);

  return x;
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

export function callInstruction(
  index: Index,
  instrArgs?: Array<Expression>
): CallInstruction {
  assert(typeof index.type === "string");

  const n: CallInstruction = {
    type: "CallInstruction",
    id: "call",
    index
  };

  if (typeof instrArgs === "object") {
    n.instrArgs = instrArgs;
  }

  return n;
}

export function ifInstruction(
  testLabel: Identifier,
  result: ?Valtype,
  test: Array<Instruction>,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>
): IfInstruction {
  assert(typeof testLabel.type === "string");

  return {
    type: "IfInstruction",
    id: "if",
    testLabel,
    test,
    result,
    consequent,
    alternate
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

export function moduleImport(
  module: string,
  name: string,
  descr: ImportDescr
): ModuleImport {
  return {
    type: "ModuleImport",
    module,
    name,
    descr
  };
}

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

export function table(
  elementType: TableElementType,
  limits: Limit,
  name: ?Identifier,
  elements?: Array<Index>
): Table {
  const n: Table = {
    type: "Table",
    elementType,
    limits,
    name
  };

  if (typeof elements === "object") {
    n.elements = elements;
  }

  return n;
}

export function limits(min: number, max?: number): Limit {
  assert(typeof min === "number");

  if (typeof max !== "undefined") {
    assert(typeof max === "number");
  }

  return {
    type: "Limit",
    min,
    max
  };
}

export function memory(limits: Limit, id: ?Index): Memory {
  return {
    type: "Memory",
    limits,
    id
  };
}

export function data(
  memoryIndex: Memidx,
  offset: Instruction,
  init: ByteArray
): Data {
  return {
    type: "Data",
    memoryIndex,
    offset,
    init
  };
}

export function global(
  globalType: GlobalType,
  init: Array<Instruction>,
  name: ?Identifier
): Global {
  return {
    type: "Global",
    globalType,
    init,
    name
  };
}

export function globalType(
  valtype: Valtype,
  mutability: Mutability
): GlobalType {
  return {
    type: "GlobalType",
    valtype,
    mutability
  };
}

export function byteArray(values: Array<Byte>): ByteArray {
  return {
    type: "Bytes",
    values
  };
}

export function leadingComment(value: string): LeadingComment {
  return {
    type: "LeadingComment",
    value
  };
}

export function blockComment(value: string): BlockComment {
  return {
    type: "BlockComment",
    value
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

export function start(index: Index): Start {
  return {
    type: "Start",
    index
  };
}

export function elem(
  table: Index = indexLiteral(0),
  offset: Array<Instruction>,
  funcs: Array<Index>
): Elem {
  return {
    type: "Elem",
    table,
    offset,
    funcs
  };
}

export function indexInFuncSection(index: Index): IndexInFuncSection {
  return {
    type: "IndexInFuncSection",
    index
  };
}

export function isAnonymous(ident: Identifier): boolean {
  return ident.raw === "";
}

export { traverse, traverseWithHooks } from "./traverse";
export { signatures } from "./signatures";
export { getSectionMetadata, sortSectionMetadata } from "./utils";
export { cloneNode } from "./clone";
