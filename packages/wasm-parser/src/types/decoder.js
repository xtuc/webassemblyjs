// @flow
/* eslint no-unused-vars: off */

type Byte = number;

type VariableLengthValue = {
  value: number,
  nextIndex: number
};

interface Type {
  value: number;
  nextIndex: number;
}

type Decoded32 = VariableLengthValue;
type Decoded64 = VariableLengthValue;
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
  index: number,

  startLoc: Position,
  endLoc: Position
};

type DecodedElementInCodeSection = {
  startLoc: Position,
  endLoc: Position,
  bodySize: number,
  code: Array<Instruction>,
  locals: Array<Valtype>
};

type DecodedModuleMemory = Memory;

type DecodedModuleTable = Table;

type State = {
  typesInModule: Array<DecodedModuleType>,
  functionsInModule: Array<DecodedModuleFunc>,
  tablesInModule: Array<DecodedModuleTable>,
  memoriesInModule: Array<DecodedModuleMemory>,

  elementsInExportSection: Array<DecodedElementInExportSection>,
  elementsInCodeSection: Array<DecodedElementInCodeSection>
};

type DecoderOpts = {
  dump: boolean,
  ignoreDataSection: boolean,
  ignoreCodeSection: boolean
};
