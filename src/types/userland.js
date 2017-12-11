// @flow

type CompiledModule = {
  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;
}

type CompiledModuleExportDescr = {
  name: string;
  kind: string;
}

type CompiledModuleImportDescr = {
  module: string;
  name: string;
  kind: string;
}

type Hostfunc = any;

type MemoryDescriptor = {
  initial: number;
  maximum?: number;
};

type TableDescriptor = {
  element: string;
  initial: number;
  maximum?: number;
};

type ImportObject = {
  js?: JSImportObject;
};

type JSImportObject = {
  tbl?: TableInstance;
};
