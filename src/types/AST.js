// @flow
/* eslint-disable */
type Valtype = 'i32' | 'i64' | 'f32' | 'f64' | 'label';
type ExportDescr = 'func' | 'table' | 'memory' | 'global';
type Index = NumberLiteral | Identifier;

type NodePath = {
  node: Node;
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
  type: string;
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

// TODO(sven): modulefields (https://webassembly.github.io/spec/text/modules.html#text-modulefield)
type ModuleFields = any

interface Module {
  type: 'Module';
  id: ?string;
  fields: ?ModuleFields;
}

interface Program {
  type: 'Program';
  body: Array<Instruction | Module>;
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
  test: Instruction;
  result: ?Valtype;
  consequent: Array<Instruction>;
  alternate: Array<Instruction>;
}

type CallInstruction = {
  ...Instruction;

  type: 'CallInstruction';
  index: Index;
}
