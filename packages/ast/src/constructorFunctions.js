// @flow

function assert(cond: boolean) {
  if (!cond) {
    throw new Error("assertion error");
  }
}

export function module(
  id: ?string,
  fields: Array<Node>,
  metadata?: ModuleMetadata
): Module {
  if (id !== null && id !== undefined) {
    assert(typeof id === "string");
  }

  assert(typeof fields === "object" && typeof fields.length !== "undefined");

  if (metadata !== null && metadata !== undefined) {
  }

  const node: Module = {
    type: "Module",
    id,
    fields
  };

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}

export function moduleMetadata(
  sections: Array<SectionMetadata>,
  functionNames?: Array<FunctionNameMetadata>,
  localNames?: Array<ModuleMetadata>
): ModuleMetadata {
  assert(
    typeof sections === "object" && typeof sections.length !== "undefined"
  );

  if (functionNames !== null && functionNames !== undefined) {
    assert(
      typeof functionNames === "object" &&
        typeof functionNames.length !== "undefined"
    );
  }

  if (localNames !== null && localNames !== undefined) {
    assert(
      typeof localNames === "object" && typeof localNames.length !== "undefined"
    );
  }

  const node: ModuleMetadata = {
    type: "ModuleMetadata",
    sections
  };

  if (typeof functionNames !== "undefined" && functionNames.length > 0) {
    node.functionNames = functionNames;
  }

  if (typeof localNames !== "undefined" && localNames.length > 0) {
    node.localNames = localNames;
  }

  return node;
}

export function moduleNameMetadata(value: string): ModuleNameMetadata {
  assert(typeof value === "string");

  const node: ModuleNameMetadata = {
    type: "ModuleNameMetadata",
    value
  };

  return node;
}

export function functionNameMetadata(
  value: string,
  index: number
): FunctionNameMetadata {
  assert(typeof value === "string");

  assert(typeof index === "number");

  const node: FunctionNameMetadata = {
    type: "FunctionNameMetadata",
    value,
    index
  };

  return node;
}

export function localNameMetadata(
  value: string,
  localIndex: number,
  functionIndex: number
): LocalNameMetadata {
  assert(typeof value === "string");

  assert(typeof localIndex === "number");

  assert(typeof functionIndex === "number");

  const node: LocalNameMetadata = {
    type: "LocalNameMetadata",
    value,
    localIndex,
    functionIndex
  };

  return node;
}

export function binaryModule(id: ?string, blob: Array<string>): BinaryModule {
  if (id !== null && id !== undefined) {
    assert(typeof id === "string");
  }

  assert(typeof blob === "object" && typeof blob.length !== "undefined");

  const node: BinaryModule = {
    type: "BinaryModule",
    id,
    blob
  };

  return node;
}

export function quoteModule(id: ?string, string: Array<string>): QuoteModule {
  if (id !== null && id !== undefined) {
    assert(typeof id === "string");
  }

  assert(typeof string === "object" && typeof string.length !== "undefined");

  const node: QuoteModule = {
    type: "QuoteModule",
    id,
    string
  };

  return node;
}

export function sectionMetadata(
  section: SectionName,
  startOffset: number,
  size: NumberLiteral,
  vectorOfSize: NumberLiteral
): SectionMetadata {
  assert(typeof startOffset === "number");

  const node: SectionMetadata = {
    type: "SectionMetadata",
    section,
    startOffset,
    size,
    vectorOfSize
  };

  return node;
}

export function loopInstruction(
  label: ?Identifier,
  resulttype: ?Valtype,
  instr: Array<Instruction>
): LoopInstruction {
  if (label !== null && label !== undefined) {
  }

  if (resulttype !== null && resulttype !== undefined) {
  }

  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  const node: LoopInstruction = {
    type: "LoopInstruction",
    id: "loop",
    label,
    resulttype,
    instr
  };

  return node;
}

export function instruction(
  id: string,
  args: Array<Expression> = [],
  namedArgs?: Object = {}
): GenericInstruction {
  assert(typeof id === "string");

  assert(typeof args === "object" && typeof args.length !== "undefined");

  if (namedArgs !== null && namedArgs !== undefined) {
  }

  const node: GenericInstruction = {
    type: "Instr",
    id,
    args
  };

  if (Object.keys(namedArgs).length !== 0) {
    node.namedArgs = namedArgs;
  }

  return node;
}

export function objectInstruction(
  id: string,
  args: Array<Expression> = [],
  namedArgs?: Object = {},
  object: Valtype
): ObjectInstruction {
  assert(typeof id === "string");

  assert(typeof args === "object" && typeof args.length !== "undefined");

  if (namedArgs !== null && namedArgs !== undefined) {
  }

  const node: ObjectInstruction = {
    type: "Instr",
    id,
    args,
    object
  };

  if (Object.keys(namedArgs).length !== 0) {
    node.namedArgs = namedArgs;
  }

  return node;
}

export function ifInstruction(
  testLabel: Identifier,
  test: Array<Instruction>,
  result: ?Valtype,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>
): IfInstruction {
  assert(typeof test === "object" && typeof test.length !== "undefined");

  if (result !== null && result !== undefined) {
  }

  assert(
    typeof consequent === "object" && typeof consequent.length !== "undefined"
  );

  assert(
    typeof alternate === "object" && typeof alternate.length !== "undefined"
  );

  const node: IfInstruction = {
    type: "IfInstruction",
    id: "if",
    testLabel,
    test,
    result,
    consequent,
    alternate
  };

  return node;
}

export function stringLiteral(value: string): StringLiteral {
  assert(typeof value === "string");

  const node: StringLiteral = {
    type: "StringLiteral",
    value
  };

  return node;
}

export function numberLiteral(value: number, raw: string): NumberLiteral {
  assert(typeof value === "number");

  assert(typeof raw === "string");

  const node: NumberLiteral = {
    type: "NumberLiteral",
    value,
    raw
  };

  return node;
}

export function longNumberLiteral(
  value: LongNumber,
  raw: string
): LongNumberLiteral {
  assert(typeof raw === "string");

  const node: LongNumberLiteral = {
    type: "LongNumberLiteral",
    value,
    raw
  };

  return node;
}

export function floatLiteral(
  value: number,
  nan?: boolean,
  inf?: boolean,
  raw: string
): FloatLiteral {
  assert(typeof value === "number");

  if (nan !== null && nan !== undefined) {
    assert(typeof nan === "boolean");
  }

  if (inf !== null && inf !== undefined) {
    assert(typeof inf === "boolean");
  }

  assert(typeof raw === "string");

  const node: FloatLiteral = {
    type: "FloatLiteral",
    value,
    raw
  };

  if (nan === true) {
    node.nan = true;
  }

  if (inf === true) {
    node.inf = true;
  }

  return node;
}

export function elem(
  table: Index,
  offset: Array<Instruction>,
  funcs: Array<Index>
): Elem {
  assert(typeof offset === "object" && typeof offset.length !== "undefined");

  assert(typeof funcs === "object" && typeof funcs.length !== "undefined");

  const node: Elem = {
    type: "Elem",
    table,
    offset,
    funcs
  };

  return node;
}

export function indexInFuncSection(index: Index): IndexInFuncSection {
  const node: IndexInFuncSection = {
    type: "IndexInFuncSection",
    index
  };

  return node;
}

export function valtypeLiteral(name: Valtype): ValtypeLiteral {
  const node: ValtypeLiteral = {
    type: "ValtypeLiteral",
    name
  };

  return node;
}

export function typeInstruction(
  id: ?Index,
  functype: Signature
): TypeInstruction {
  if (id !== null && id !== undefined) {
  }

  const node: TypeInstruction = {
    type: "TypeInstruction",
    id,
    functype
  };

  return node;
}

export function start(index: Index): Start {
  const node: Start = {
    type: "Start",
    index
  };

  return node;
}

export function globalType(
  valtype: Valtype,
  mutability: Mutability
): GlobalType {
  const node: GlobalType = {
    type: "GlobalType",
    valtype,
    mutability
  };

  return node;
}

export function leadingComment(value: string): LeadingComment {
  assert(typeof value === "string");

  const node: LeadingComment = {
    type: "LeadingComment",
    value
  };

  return node;
}

export function blockComment(value: string): BlockComment {
  assert(typeof value === "string");

  const node: BlockComment = {
    type: "BlockComment",
    value
  };

  return node;
}

export function data(
  memoryIndex: Memidx,
  offset: Instruction,
  init: ByteArray
): Data {
  const node: Data = {
    type: "Data",
    memoryIndex,
    offset,
    init
  };

  return node;
}

export function global(
  globalType: GlobalType,
  init: Array<Instruction>,
  name: ?Identifier
): Global {
  assert(typeof init === "object" && typeof init.length !== "undefined");

  if (name !== null && name !== undefined) {
  }

  const node: Global = {
    type: "Global",
    globalType,
    init,
    name
  };

  return node;
}

export function table(
  elementType: TableElementType,
  limits: Limit,
  name: ?Identifier,
  elements?: Array<Index>
): Table {
  if (name !== null && name !== undefined) {
  }

  if (elements !== null && elements !== undefined) {
    assert(
      typeof elements === "object" && typeof elements.length !== "undefined"
    );
  }

  const node: Table = {
    type: "Table",
    elementType,
    limits,
    name
  };

  if (typeof elements !== "undefined" && elements.length > 0) {
    node.elements = elements;
  }

  return node;
}

export function memory(limits: Limit, id: ?Index): Memory {
  if (id !== null && id !== undefined) {
  }

  const node: Memory = {
    type: "Memory",
    limits,
    id
  };

  return node;
}

export function funcImportDescr(
  id: Identifier,
  signature: Signature
): FuncImportDescr {
  const node: FuncImportDescr = {
    type: "FuncImportDescr",
    id,
    signature
  };

  return node;
}

export function moduleImport(
  module: string,
  name: string,
  descr: ImportDescr
): ModuleImport {
  assert(typeof module === "string");

  assert(typeof name === "string");

  const node: ModuleImport = {
    type: "ModuleImport",
    module,
    name,
    descr
  };

  return node;
}

export function moduleExportDescr(
  exportType: ExportDescrType,
  id: Index
): ModuleExportDescr {
  const node: ModuleExportDescr = {
    type: "ModuleExportDescr",
    exportType,
    id
  };

  return node;
}

export function moduleExport(
  name: string,
  descr: ModuleExportDescr
): ModuleExport {
  assert(typeof name === "string");

  const node: ModuleExport = {
    type: "ModuleExport",
    name,
    descr
  };

  return node;
}

export function limit(min: number, max?: number): Limit {
  assert(typeof min === "number");

  if (max !== null && max !== undefined) {
    assert(typeof max === "number");
  }

  const node: Limit = {
    type: "Limit",
    min
  };

  if (typeof max !== "undefined") {
    node.max = max;
  }

  return node;
}

export function signature(
  params: Array<FuncParam>,
  results: Array<Valtype>
): Signature {
  assert(typeof params === "object" && typeof params.length !== "undefined");

  assert(typeof results === "object" && typeof results.length !== "undefined");

  const node: Signature = {
    type: "Signature",
    params,
    results
  };

  return node;
}

export function program(body: Array<Node>): Program {
  assert(typeof body === "object" && typeof body.length !== "undefined");

  const node: Program = {
    type: "Program",
    body
  };

  return node;
}

export function identifier(value: string, raw?: string): Identifier {
  assert(typeof value === "string");

  if (raw !== null && raw !== undefined) {
    assert(typeof raw === "string");
  }

  const node: Identifier = {
    type: "Identifier",
    value
  };

  if (typeof raw !== "undefined") {
    node.raw = raw;
  }

  return node;
}

export function blockInstruction(
  label: ?Identifier,
  instr: Array<Instruction>,
  result: ?Valtype
): BlockInstruction {
  if (label !== null && label !== undefined) {
  }

  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  if (result !== null && result !== undefined) {
  }

  const node: BlockInstruction = {
    type: "BlockInstruction",
    id: "block",
    label,
    instr,
    result
  };

  return node;
}

export function callInstruction(
  index: Index,
  instrArgs?: Array<Expression>
): CallInstruction {
  if (instrArgs !== null && instrArgs !== undefined) {
    assert(
      typeof instrArgs === "object" && typeof instrArgs.length !== "undefined"
    );
  }

  const node: CallInstruction = {
    type: "CallInstruction",
    id: "call",
    index
  };

  if (typeof instrArgs !== "undefined" && instrArgs.length > 0) {
    node.instrArgs = instrArgs;
  }

  return node;
}

export function callIndirectInstruction(
  signature: SignatureOrTypeRef,
  intrs?: Array<Expression>,
  index?: Index
): CallIndirectInstruction {
  if (intrs !== null && intrs !== undefined) {
    assert(typeof intrs === "object" && typeof intrs.length !== "undefined");
  }

  if (index !== null && index !== undefined) {
  }

  const node: CallIndirectInstruction = {
    type: "CallIndirectInstruction",
    signature
  };

  if (typeof intrs !== "undefined" && intrs.length > 0) {
    node.intrs = intrs;
  }

  if (typeof index !== "undefined") {
    node.index = index;
  }

  return node;
}

export function byteArray(values: Array<Byte>): ByteArray {
  assert(typeof values === "object" && typeof values.length !== "undefined");

  const node: ByteArray = {
    type: "ByteArray",
    values
  };

  return node;
}

export function func(
  name: ?Index,
  signature: SignatureOrTypeRef,
  body: Array<Instruction>,
  isExternal?: boolean,
  metadata?: FuncMetadata
): Func {
  if (name !== null && name !== undefined) {
  }

  assert(typeof body === "object" && typeof body.length !== "undefined");

  if (isExternal !== null && isExternal !== undefined) {
    assert(typeof isExternal === "boolean");
  }

  if (metadata !== null && metadata !== undefined) {
  }

  const node: Func = {
    type: "Func",
    name,
    signature,
    body
  };

  if (isExternal === true) {
    node.isExternal = true;
  }

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}
