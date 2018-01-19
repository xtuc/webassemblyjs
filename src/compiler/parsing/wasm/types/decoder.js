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
  value: string,
  nextIndex: number
};

type DecodedSymbol = {
  name: string,
  object?: Valtype,
  numberOfArgs: number
};

/**
 * Data structures used in decoder's state
 */
type DecodedModuleType = {
  params: Array<FuncParam>,
  result: Array<Valtype>
};

type DecodedModuleFunc = {
  id: Identifier,
  signature: DecodedModuleType,
  isExternal: boolean
};

type DecodedElementInExportSection = {
  name: string,
  type: ExportDescr,
  signature: ?DecodedModuleType,
  id: ?Index,
  index: number
};

type DecodedElementInCodeSection = {
  code: Array<Instruction>,
  locals: Array<Valtype>
};

type DecodedModuleMemory = Memory;

type State = {
  typesInModule: Array<DecodedModuleType>,
  functionsInModule: Array<DecodedModuleFunc>,
  memoriesInModule: Array<DecodedModuleMemory>,

  elementsInExportSection: Array<DecodedElementInExportSection>,
  elementsInCodeSection: Array<DecodedElementInCodeSection>
};
