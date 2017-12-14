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
type DecodedModuleType = {
  params: Array<Valtype>;
  result: Array<Valtype>;
}

type DecodedModuleFunc = {
  id: Identifier;
  signature: DecodedModuleType;
};

type DecodedElementInExportSection = {
  name: string;
  type: ExportDescr;
  signature: ?DecodedModuleType;
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

type DecodedModuleMemory = Memory;

type State = {
  typesInModule: Array<DecodedModuleType>;
  functionsInModule: Array<DecodedModuleFunc>;
  memoriesInModule: Array<DecodedModuleMemory>;

  elementsInExportSection: Array<DecodedElementInExportSection>;
  elementsInCodeSection: Array<DecodedElementInCodeSection>,
};
