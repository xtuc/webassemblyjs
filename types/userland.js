// @flow
/* eslint no-unused-vars: off */

interface CompiledModule {
  _ir: IR;
  _ast: Program; // FIXME(sven): do we still need the AST here?

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;
}

interface Instance {
  exports: any;
  executeStartFunc: (ir: IR, offset: number) => void;
}

type CompiledModuleExportDescr = {
  name: string,
  kind: string,
};

type CompiledModuleImportDescr = {
  module: string,
  name: string,
  kind: string,
};

type MemoryDescriptor = {
  initial: number,
  maximum?: ?number,
};

interface MemoryInstance {
  buffer: ArrayBuffer;
}

type TableDescriptor = {
  element: string,
  initial: number,
  maximum?: number,
};

type ImportObject =
  | Object
  | {
      _internalInstanceOptions: InternalInstanceOptions,
    };

type InstansitatedInstanceAndModule = {
  instance: Instance,
  module: CompiledModule,
};

type InternalInstanceOptions = {
  checkForI64InSignature: boolean,
  returnStackLocal: boolean,
};
