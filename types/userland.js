// @flow
/* eslint no-unused-vars: off */

import { type Instance } from "webassemblyjs/lib/interpreter";

type CompiledModule = {
  _ir: IR,
  _ast: Program, // FIXME(sven): do we still need the AST here?

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
  maximum?: ?number
};

interface MemoryInstance {
  buffer: ArrayBuffer;
}

type TableDescriptor = {
  element: string,
  initial: number,
  maximum?: number
};

type ImportObject =
  | Object
  | {
      _internalInstanceOptions: InternalInstanceOptions
    };

type InstansitatedInstanceAndModule = {
  instance: Instance,
  module: CompiledModule
};

type InternalInstanceOptions = {
  checkForI64InSignature: boolean,
  returnStackLocal: boolean
};
