// @flow

export {
  module,
  moduleMetadata,
  functionNameMetadata,
  moduleNameMetadata,
  localNameMetadata,
  quoteModule,
  binaryModule,
  sectionMetadata,
  loopInstruction,
  instruction,
  ifInstruction,
  longNumberLiteral,
  stringLiteral,
  floatLiteral,
  numberLiteral,
  indexInFuncSection,
  elem,
  start,
  typeInstruction,
  leadingComment,
  blockComment,
  globalType,
  global,
  data,
  memory,
  table,
  moduleImport,
  program,
  callInstruction,
  blockInstruction,
  identifier,
  byteArray,
  moduleExport,
  moduleExportDescr,
  callIndirectInstruction,
  signature,
  funcImportDescr,
  func,
  objectInstruction,
  limit,
  valtypeLiteral
} from "./nodes";

export {
  numberLiteralFromRaw,
  withLoc,
  withRaw,
  funcParam,
  indexLiteral,
  memIndexLiteral
} from "./node-helpers.js";

export { traverse, traverseWithHooks } from "./traverse";

export { signatures } from "./signatures";

export {
  isInstruction,
  getSectionMetadata,
  sortSectionMetadata,
  orderedInsertNode,
  assertHasLoc,
  getEndOfSection,
  shiftSection,
  shiftLoc,
  isAnonymous,
  getUniqueNameGenerator,
  signatureForOpcode
} from "./utils";

export { cloneNode } from "./clone";
