// @flow
/* eslint-disable */

type Bytes = number;

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

type ModuleInstance = {
  types: any;
  funcaddrs: any;
  tableaddrs: any;
  memaddrs: any;
  globaladdrs: any;

  exports: Array<ExportInstance>;
};

