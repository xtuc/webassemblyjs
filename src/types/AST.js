// @flow

import type { i32 } from "../interpreter/runtime/values/i32";

type U32Literal = NumberLiteral & {
  value: NumberInterface<i32>
};

type Typeidx = U32Literal;
type Funcidx = U32Literal;
type Tableidx = U32Literal;
type Memidx = U32Literal;
type Globalidx = U32Literal;
type Localidx = U32Literal;
type Labelidx = U32Literal;

type ModuleType =
  | "Module"
  | "BinaryModule" // WAST
  | "QuoteModule"; // WAST

type Index =
  | Typeidx
  | Funcidx
  | Tableidx
  | Memidx
  | Globalidx
  | Localidx
  | Labelidx
  | Identifier; // WAST shorthand

type Valtype = "i32" | "i64" | "f32" | "f64" | "label";
type ExportDescr = "Func" | "Table" | "Memory" | "Global";
type Mutability = "const" | "var";
type InstructionType = "Instr" | ControlInstruction;
type ControlInstruction =
  | "CallInstruction"
  | "BlockInstruction"
  | "LoopInstruction"
  | "IfInstruction";

type NodePath<T> = {
  node: T
};

type UnaryExpressionOperators = "-" | "+";

type Expression =
  | Identifier
  | NumberLiteral
  | LongNumberLiteral
  | ValtypeLiteral
  | Instruction
  | StringLiteral;

type TableElementType = "anyfunc";

/**
 * AST types
 */

interface LongNumber {
  high: number;
  low: number;
}

interface Position {
  line: number;
  column: number;
}

interface SourceLocation {
  start: Position;
  // end: Position;
}

interface Node {
  type: any;
  loc?: SourceLocation;
}

interface Program {
  type: "Program";
  body: Array<Node>;
}

/**
 * Concrete values
 */
interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}

interface LongNumberLiteral {
  type: "LongNumberLiteral";
  value: LongNumber;
}

interface Identifier {
  type: "Identifier";
  value: string;
}

interface UnaryExpression {
  type: "UnaryExpression";
  operator: UnaryExpressionOperators;
  argument: Expression;
}

/**
 * Module structure
 */

type ModuleFields = Array<Node>;

interface Module {
  type: ModuleType;
  id: ?string;
  fields: ModuleFields;
}

type BinaryModule = Module & {
  type: "BinaryModule",
  blob: Array<string>
};

type QuoteModule = Module & {
  type: "QuoteModule",
  string: Array<string>
};

type FuncParam = {
  id: ?string,
  valtype: Valtype
};

interface Func {
  type: "Func";

  // Only in WAST
  // TODO(sven): rename id to name
  id: ?Index;

  params: Array<FuncParam>;
  result: ?Valtype;
  body: Array<Instruction>;
  isExternal?: boolean;
}

/**
 * Instructions
 */
interface Instruction {
  type: InstructionType;
  id: string;
  args: Array<Expression>;

  // key=value for special instruction arguments
  namedArgs?: Object;
}

type ObjectInstruction = Instruction & {
  object: Valtype
};

type LoopInstruction = Instruction & {
  type: "LoopInstruction",
  label: ?Identifier,
  resulttype: ?Valtype,
  instr: Array<Instruction>
};

type BlockInstruction = Instruction & {
  type: "BlockInstruction",
  label: ?Identifier,
  instr: Array<Instruction>,
  result: ?Valtype
};

type IfInstruction = Instruction & {
  type: "IfInstruction",
  testLabel: Identifier, // only for WAST
  result: ?Valtype,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>
};

type CallInstruction = Instruction & {
  type: "CallInstruction",
  index: Index
};

interface ModuleExport {
  type: "ModuleExport";
  name: string;
  descr: {
    type: ExportDescr,
    id: Index
  };
}

type Limit = {
  type: "Limit",
  min: number,
  max?: number
};

type FuncImportDescr = {
  type: "FuncImportDescr",
  value: Index,
  params: Array<FuncParam>,
  results: Array<Valtype>
};

type ImportDescr = FuncImportDescr | GlobalType;

interface ModuleImport {
  type: "ModuleImport";
  module: string;
  name: string;
  descr: ImportDescr;
}

type Table = Node & {
  type: "Table",
  elementType: TableElementType,
  limits: Limit
};

type Memory = {
  type: "Memory",
  limits: Limit,
  id: ?Index
};

type ByteArray = {
  type: "Bytes",
  values: Array<Byte>
};

type Data = {
  type: "Data",
  memoryIndex: Index,
  offset: Array<Node>,
  init: ByteArray
};

type Global = {
  type: "Global",
  globalType: GlobalType,
  init: Array<Instruction>
};

type GlobalType = {
  type: "GlobalType",
  valtype: Valtype,
  mutability: Mutability
};

type LeadingComment = {
  type: "LeadingComment",
  value: string
};

type BlockComment = {
  type: "BlockComment",
  value: string
};

type ValtypeLiteral = {
  type: "ValtypeLiteral",
  name: Valtype
};
