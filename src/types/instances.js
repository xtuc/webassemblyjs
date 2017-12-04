// @flow
/* eslint-disable */

type Addr = any;

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

type ModuleInstance = {
  types: any;
  funcaddrs: any;
  tableaddrs: any;
  memaddrs: any;
  globaladdrs: any;

  // TODO(sven): exports should have multiple exports,
  // not according to https://webassembly.github.io/spec/exec/runtime.html#module-instances?
  // https://github.com/WebAssembly/spec/issues/616
  exports: Array<ExportInstance>;
};

