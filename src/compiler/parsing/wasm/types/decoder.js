// @flow

type Byte = number;

interface Type {
  value: number;
  nextIndex: number;
}

type DecodedU32 = VariableLengthValue;
type DecodedU64 = VariableLengthValue;
type DecodedF32 = VariableLengthValue;
type DecodedF64 = VariableLengthValue;

type DecodedUTF8String = {
  value: string;
  nextIndex: number;
};

type DecodedSymbol = {
  name: string;
  object?: Valtype;
  numberOfArgs: number;
};

/**
 * Data structures used in decoder's state
 */

type DecodedModuleFunc = {
  id: Identifier;
  signature: ElementsInTypeSection;
};

type DecodedElementInTypeSection = {
  params: Array<Valtype>;
  result: Array<Valtype>;
};

type DecodedElementInExportSection = {
  name: string;
  type: ExportDescr;
  signature: ?ElementsInTypeSection;
  id: ?Identifier;
  index: number;
};

type DecodedInstructionInCodeSection = {
  instruction: DecodedSymbol;
  args: Array<any>;
};

type DecodedElementInCodeSection = {
  code: Array<DecodedInstructionInCodeSection>;
  locals: Array<Valtype>;
};

type State = {
  elementsInTypeSection: Array<DecodedElementInTypeSection>;
  functionsInModule: Array<DecodedModuleFunc>;
  elementsInExportSection: Array<DecodedElementInExportSection>;
  elementsInCodeSection: Array<DecodedElementInCodeSection>,
};
