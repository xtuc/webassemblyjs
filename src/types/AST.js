// @flow

type Valtype = 'i32' | 'i64' | 'f32' | 'f64' | 'label';
type ExportDescr = 'func' | 'table' | 'memory' | 'global';
type Index = NumberLiteral | Identifier;
type Mutability = 'const' | 'var';

type NodePath<T> = {
  node: T;
};

/**
 * AST types
 */

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
  type: 'Program';
  body: Array<Node>;
}

/**
 * Concrete values
 */

interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

interface Identifier {
  type: 'Identifier';
  name: string;
}

/**
 * Module structure
 */

type ModuleFields = Array<Node>;

interface Module {
  type: 'Module';
  id: ?string;
  fields: ModuleFields;
}

type FuncParam = {
  id: ?string,
  valtype: Valtype,
};

interface Func {
  type: 'Func';

  // Only in WAST
  // TODO(sven): rename id to name and replace Index by Identifier
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
  type: 'Instr';
  id: string;
  args: Array<NumberLiteral | Identifier>;
}

type ObjectInstruction = Instruction & {
  object: Valtype;
}

type LoopInstruction = Instruction & {
  type: 'LoopInstruction';
  label: ?Identifier;
  resulttype: ?Valtype;
  instr: Array<Instruction>;
}

type BlockInstruction = Instruction & {
  type: 'BlockInstruction';
  label: ?Identifier;
  instr: Array<Instruction>;
  result: ?Valtype;
}

type IfInstruction = Instruction & {
  type: 'IfInstruction';
  testLabel: Index;
  result: ?Valtype;
  consequent: Array<Instruction>;
  alternate: Array<Instruction>;
}

type CallInstruction = Instruction & {
  type: 'CallInstruction';
  index: Index;
}

interface ModuleExport {
  type: 'ModuleExport';
  name: string;
  descr: {
    type: ExportDescr;
    id: string;
  };
}

type Limit = {
  type: 'Limit';
  min: number;
  max?: number;
}

type FuncImportDescr = {
  type: 'FuncImportDescr';
  value: NumberLiteral | Identifier;
  params: Array<FuncParam>;
  results: Array<Valtype>;
}

type ImportDescr = FuncImportDescr | GlobalType;

interface ModuleImport {
  type: 'ModuleImport';
  module: string;
  name: string;
  descr: ImportDescr;
}

type Table = {
  type: 'Table';
  elementType: 'anyfunc';
  limits: Limit;
}

type Memory = {
  type: 'Memory';
  limits: Limit;
  id: ?Identifier;
}

type ByteArray = {
  type: 'Bytes';
  values: Array<Byte>;
}

type Data = {
  type: 'Data';
  memoryIndex: Index;
  offset: Array<Node>;
  init: ByteArray;
}

type Global = {
  type: 'Global';
  globalType: GlobalType;
  init: Array<Instruction>;
}

type GlobalType = {
  type: 'GlobalType';
  valtype: Valtype;
  mutability: Mutability;
}

type LeadingComment = {
  type: 'LeadingComment';
  value: string;
}
