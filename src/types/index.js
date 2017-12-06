// @flow
/* eslint-disable */

type Bytes = number;

type Functype = [
  Array<Valtype>,
  Array<Valtype>,
];

type Addr = {
  index: Bytes;
  size: Bytes;
};

interface ExternalVal {
  type: string;
  addr: Addr;
}

type FuncExternalVal = ExternalVal & {
  type: 'Func';
};

type ExportInstance = {
  name: string;
  value: ExternalVal;
};

type FuncInstance = {
  type: Functype;
  module: ModuleInstance; // its originating module

  // TODO(sven): according to the spec the code property is a string
  // see https://webassembly.github.io/spec/exec/runtime.html#function-instances
  // but in the context of an interpreter it make no sense to me.
  // I'll store the instructions from the function body here.
  code: Array<Instruction>;
};

type ModuleInstance = {
  types: any;
  funcaddrs: any;
  tableaddrs: any;
  memaddrs: any;
  globaladdrs: any;

  exports: Array<ExportInstance>;
};

/**
 * Stack
 */
// https://webassembly.github.io/spec/exec/runtime.html#syntax-frame
type StackFrame = {
  values: Array<any>;

  globals: Array<any>;
  locals: Array<StackLocal>;
  code: Array<Instruction>;

  trace?: (number, number, Instruction) => void;
};

type StackLocal = {
  type: Valtype;
  value: any;
};

/**
 * Mocha
 */
declare var it;
declare var describe;
