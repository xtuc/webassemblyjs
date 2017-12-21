// @flow

type Valtype = 'i32' | 'i64' | 'f32' | 'f64' | 'label';
type ExportDescr = 'func' | 'table' | 'memory' | 'global';
type Index = NumberLiteral | Identifier;
type Mutability = 'const' | 'var';

type NodePath<T> = {
  node: T;
};

interface Position {
  line: number;
  column: number;
}

interface SourceLocation {
  start: Position;
  end: Position;
}

interface Node {
  type: any;
  loc?: SourceLocation;
}

interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

interface Identifier {
  type: 'Identifier';
  name: string;
}

type ModuleFields = Array<Node>;

interface Module {
  type: 'Module';
  id: ?string;
  fields: ModuleFields;
}

interface Program {
  type: 'Program';
  body: Array<Node>;
}

type FuncParam = {
  id: ?string,
  valtype: Valtype,
};

interface Func {
  type: 'Func';
  id: ?string;
  params: Array<FuncParam>;
  result: ?Valtype;
  body: Array<Instruction>;
  isExternal?: boolean;
}

type ObjectInstruction = {
  ...Instruction;

  object: Valtype;
}

interface Instruction {
  type: 'Instr';
  id: string;
  args: Array<Number | string>;
}

interface ModuleExport {
  type: 'ModuleExport';
  name: string;
  descr: {
    type: ExportDescr;
    id: string;
  };
}

type LoopInstruction = {
  ...Instruction;

  type: 'LoopInstruction';
  label: ?Identifier;
  resulttype: ?Valtype;
  instr: Array<Instruction>;
}

type BlockInstruction = {
  ...Instruction;

  type: 'BlockInstruction';
  label: ?Identifier;
  instr: Array<Instruction>;
}

type IfInstruction = {
  ...Instruction;

  type: 'IfInstruction';
  test: Index;
  result: ?Valtype;
  consequent: Array<Instruction>;
  alternate: Array<Instruction>;
}

type CallInstruction = {
  ...Instruction;

  type: 'CallInstruction';
  index: Index;
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

type BrTableInstruction = {
  type: 'BrTableInstruction';
  labels: Array<Index>;
  label: Index;
}
