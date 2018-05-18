// @flow

export * from "./nodes";

export {
  numberLiteralFromRaw,
  withLoc,
  withRaw,
  funcParam,
  indexLiteral,
  memIndexLiteral,
  instruction,
  objectInstruction
} from "./node-helpers.js";

export { traverse, traverseWithHooks } from "./traverse";

export { signatures } from "./signatures";

export {
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
