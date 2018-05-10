// @flow
/* eslint no-unused-vars: off */

type Node =
  | Module
  | ModuleMetadata
  | ModuleNameMetadata
  | FunctionNameMetadata
  | LocalNameMetadata
  | BinaryModule
  | QuoteModule
  | SectionMetadata
  | LoopInstruction
  | Instruction
  | ObjectInstruction
  | IfInstruction
  | StringLiteral
  | NumberLiteral
  | LongNumberLiteral
  | FloatLiteral
  | Elem
  | IndexInFuncSection
  | ValtypeLiteral
  | TypeInstruction
  | Start
  | GlobalType
  | LeadingComment
  | BlockComment
  | Data
  | Global
  | Table
  | Memory
  | FuncImportDescr
  | ModuleImport
  | ModuleExportDescr
  | ModuleExport
  | Limit
  | Signature
  | Program
  | Identifier
  | BlockInstruction
  | CallInstruction
  | CallIndirectInstruction
  | ByteArray
  | Func;

type Instruction =
  | LoopInstruction
  | Instruction
  | ObjectInstruction
  | IfInstruction
  | TypeInstruction
  | BlockInstruction
  | CallInstruction
  | CallIndirectInstruction;

type Expression =
  | Instruction
  | ObjectInstruction
  | StringLiteral
  | NumberLiteral
  | LongNumberLiteral
  | FloatLiteral
  | ValtypeLiteral
  | Identifier;

type NumericLiteral = NumberLiteral | LongNumberLiteral | FloatLiteral;
type Module = {
  ...BaseNode,
  type: "Module",
  id: ?string,
  fields: Array<Node>,
  metadata?: ModuleMetadata
};

type ModuleMetadata = {
  ...BaseNode,
  type: "ModuleMetadata",
  sections: Array<SectionMetadata>,
  functionNames?: Array<FunctionNameMetadata>,
  localNames?: Array<ModuleMetadata>
};

type ModuleNameMetadata = {
  ...BaseNode,
  type: "ModuleNameMetadata",
  value: string
};

type FunctionNameMetadata = {
  ...BaseNode,
  type: "FunctionNameMetadata",
  value: string,
  index: number
};

type LocalNameMetadata = {
  ...BaseNode,
  type: "LocalNameMetadata",
  value: string,
  localIndex: number,
  functionIndex: number
};

type BinaryModule = {
  ...BaseNode,
  type: "BinaryModule",
  id: ?string,
  blob: Array<string>
};

type QuoteModule = {
  ...BaseNode,
  type: "QuoteModule",
  id: ?string,
  string: Array<string>
};

type SectionMetadata = {
  ...BaseNode,
  type: "SectionMetadata",
  section: SectionName,
  startOffset: number,
  size: NumberLiteral,
  vectorOfSize: NumberLiteral
};

type LoopInstruction = {
  ...BaseNode,
  type: "LoopInstruction",
  id: string,
  label: ?Identifier,
  resulttype: ?Valtype,
  instr: Array<Instruction>
};

type GenericInstruction = {
  ...BaseNode,
  type: "Instr",
  id: string,
  args: Array<Expression>,
  namedArgs?: Object
};

type ObjectInstruction = {
  ...BaseNode,
  type: "Instr",
  id: string,
  args: Array<Expression>,
  namedArgs?: Object,
  object: Valtype
};

type IfInstruction = {
  ...BaseNode,
  type: "IfInstruction",
  id: string,
  testLabel: Identifier,
  test: Array<Instruction>,
  result: ?Valtype,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>
};

type StringLiteral = {
  ...BaseNode,
  type: "StringLiteral",
  value: string
};

type NumberLiteral = {
  ...BaseNode,
  type: "NumberLiteral",
  value: number,
  raw: string
};

type LongNumberLiteral = {
  ...BaseNode,
  type: "LongNumberLiteral",
  value: LongNumber,
  raw: string
};

type FloatLiteral = {
  ...BaseNode,
  type: "FloatLiteral",
  value: number,
  nan?: boolean,
  inf?: boolean,
  raw: string
};

type Elem = {
  ...BaseNode,
  type: "Elem",
  table: Index,
  offset: Array<Instruction>,
  funcs: Array<Index>
};

type IndexInFuncSection = {
  ...BaseNode,
  type: "IndexInFuncSection",
  index: Index
};

type ValtypeLiteral = {
  ...BaseNode,
  type: "ValtypeLiteral",
  name: Valtype
};

type TypeInstruction = {
  ...BaseNode,
  type: "TypeInstruction",
  id: ?Index,
  functype: Signature
};

type Start = {
  ...BaseNode,
  type: "Start",
  index: Index
};

type GlobalType = {
  ...BaseNode,
  type: "GlobalType",
  valtype: Valtype,
  mutability: Mutability
};

type LeadingComment = {
  ...BaseNode,
  type: "LeadingComment",
  value: string
};

type BlockComment = {
  ...BaseNode,
  type: "BlockComment",
  value: string
};

type Data = {
  ...BaseNode,
  type: "Data",
  memoryIndex: Memidx,
  offset: Instruction,
  init: ByteArray
};

type Global = {
  ...BaseNode,
  type: "Global",
  globalType: GlobalType,
  init: Array<Instruction>,
  name: ?Identifier
};

type Table = {
  ...BaseNode,
  type: "Table",
  elementType: TableElementType,
  limits: Limit,
  name: ?Identifier,
  elements?: Array<Index>
};

type Memory = {
  ...BaseNode,
  type: "Memory",
  limits: Limit,
  id: ?Index
};

type FuncImportDescr = {
  ...BaseNode,
  type: "FuncImportDescr",
  id: Identifier,
  signature: Signature
};

type ModuleImport = {
  ...BaseNode,
  type: "ModuleImport",
  module: string,
  name: string,
  descr: ImportDescr
};

type ModuleExportDescr = {
  ...BaseNode,
  type: "ModuleExportDescr",
  exportType: ExportDescrType,
  id: Index
};

type ModuleExport = {
  ...BaseNode,
  type: "ModuleExport",
  name: string,
  descr: ModuleExportDescr
};

type Limit = {
  ...BaseNode,
  type: "Limit",
  min: number,
  max?: number
};

type Signature = {
  ...BaseNode,
  type: "Signature",
  params: Array<FuncParam>,
  results: Array<Valtype>
};

type Program = {
  ...BaseNode,
  type: "Program",
  body: Array<Node>
};

type Identifier = {
  ...BaseNode,
  type: "Identifier",
  value: string,
  raw?: string
};

type BlockInstruction = {
  ...BaseNode,
  type: "BlockInstruction",
  id: string,
  label: ?Identifier,
  instr: Array<Instruction>,
  result: ?Valtype
};

type CallInstruction = {
  ...BaseNode,
  type: "CallInstruction",
  id: string,
  index: Index,
  instrArgs?: Array<Expression>
};

type CallIndirectInstruction = {
  ...BaseNode,
  type: "CallIndirectInstruction",
  signature: SignatureOrTypeRef,
  intrs?: Array<Expression>,
  index?: Index
};

type ByteArray = {
  ...BaseNode,
  type: "ByteArray",
  values: Array<Byte>
};

type Func = {
  ...BaseNode,
  type: "Func",
  name: ?Index,
  signature: SignatureOrTypeRef,
  body: Array<Instruction>,
  isExternal?: boolean,
  metadata?: FuncMetadata
};
