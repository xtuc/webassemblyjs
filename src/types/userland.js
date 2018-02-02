// @flow

type CompiledModule = {
  _ast: Program,

  exports: Array<CompiledModuleExportDescr>,
  imports: Array<CompiledModuleImportDescr>
};

type CompiledModuleExportDescr = {
  name: string,
  kind: string
};

type CompiledModuleImportDescr = {
  module: string,
  name: string,
  kind: string
};

type Hostfunc = any;

type MemoryDescriptor = {
  initial: number,
  maximum?: number
};

interface MemoryInstance {
  buffer: ArrayBuffer;
}

type TableDescriptor = {
  element: string,
  initial: number,
  maximum?: number
};

type ImportObject = any;

type InstansitatedInstanceAndModule = {
  instance: Instance,
  module: CompiledModule
};
