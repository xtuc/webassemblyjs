// @flow

type Byte = number;

type U32 = {
  value: number;
  nextIndex: number;
}

type Symbol = {
  name: string;
  object?: Valtype;
  numberOfArgs: number;
};

/**
 * Data structures used in decoder's state
 */

type ElementInFuncSection = {
  id: Identifier;
  signature: ElementsInTypeSection;
};

type ElementInTypeSection = {
  params: Array<Valtype>;
  result: Array<Valtype>;
};

type ElementInExportSection = {
  name: string;
  type: ExportDescr;
  signature: ElementsInTypeSection;
  id: Identifier;
  index: number;
};

type InstructionInCodeSection = {
  instruction: Symbol;
  args: Array<any>;
};

type ElementInCodeSection = {
  code: Array<InstructionInCodeSection>;
  locals: Array<Valtype>;
};

type State = {
  elementsInTypeSection: Array<ElementInTypeSection>;
  elementsInFuncSection: Array<ElementInFuncSection>;
  elementsInExportSection: Array<ElementInExportSection>;
  elementsInCodeSection: Array<ElementInCodeSection>,
};
