// @flow

type Bytes = number;

type Functype = [Array<Valtype>, Array<Valtype>];

type Addr = {
  index: Bytes,
  size: Bytes
};

type FuncAddr = Addr;
type TableAddr = Addr;
type MemAddr = Addr;
type GlobalAddr = Addr;

interface ExternalVal {
  type: string;
  addr: Addr;
}

type FuncExternalVal = ExternalVal & {
  type: "Func"
};

type ExportInstance = {
  name: string,
  value: ExternalVal
};

type FuncInstance = {
  type: Functype,
  module: ?ModuleInstance, // its originating module

  // TODO(sven): according to the spec the code property is a string
  // see https://webassembly.github.io/spec/exec/runtime.html#function-instances
  // but in the context of an interpreter it make no sense to me.
  // I'll store the instructions from the function body here.
  code: Array<Instruction> | Function,

  isExternal: boolean
};

type ModuleInstance = {
  types: any,

  funcaddrs: Array<FuncAddr>,
  tableaddrs: Array<TableAddr>,
  memaddrs: Array<MemAddr>,
  globaladdrs: Array<GlobalAddr>,

  exports: Array<ExportInstance>
};

/**
 * Stack
 */
// https://webassembly.github.io/spec/exec/runtime.html#syntax-frame
type StackFrame = {
  values: Array<any>,

  globals: Array<any>,
  locals: Array<StackLocal>,
  labels: Array<Label>,
  code: Array<Instruction>,

  originatingModule: ModuleInstance,
  allocator: Allocator,

  trace?: (number, number, Instruction) => void
};

type StackLocal = {
  type: Valtype,
  value: any
};

type Label = {
  arity: number,
  value: any,
  id: ?Identifier
};

type Signal = number;

/**
 * Mocha
 */
declare var it;
declare var describe;

interface MemoryInstance {
  buffer: Array<any>;
  offset: number;
}

interface Allocator {
  malloc(Bytes): Addr;
  get(Addr): any;
  set(Addr, any): void;
  free(Addr): void;
}

interface TableInstance {
  get(number): ?Hostfunc;
  push(Hostfunc): void;
}
