// @flow
/* eslint-disable */
type Valtype = 'i32' | 'i64' | 'f32' | 'f64';
type ExportDescr = 'func' | 'table' | 'memory' | 'global';

interface Node {
  type: string;
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

// TODO(sven): define types
type Type = any;

type FuncParam = {
  id: ?string,
  valtype: Valtype,
};

interface Func {
  type: 'Func';
  id: ?string;
  params: Array<FuncParam>;
  result: ?Type;
  body: Array<Instruction>;
}

interface Instruction {
  type: 'Instr';
  id: string;
  args: ?Array<Number | string>;
}


interface ModuleExport {
  type: 'ModuleExport';
  name: string;
  descr: {
    type: ExportDescr;
    id: string;
  };
}
