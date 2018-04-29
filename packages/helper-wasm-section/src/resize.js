// @flow

import { encodeU32 } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata } from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

const debug = require("debug")("wasm");

export function resizeSectionByteSize(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName,
  deltaBytes: number
): Uint8Array {
  const sectionMetadata = getSectionMetadata(ast, section);

  if (typeof sectionMetadata === "undefined") {
    throw new Error("Section metadata not found");
  }

  // Encode the current value to know the number of bytes to override
  const oldSizeInBytes = encodeU32(sectionMetadata.size.value);

  const newSectionSize = sectionMetadata.size.value + deltaBytes;

  // Update AST
  sectionMetadata.size.value = newSectionSize;

  debug(
    "resize byte size section=%s detla=%d newValue=%s",
    section,
    deltaBytes,
    newSectionSize
  );

  return overrideBytesInBuffer(
    uint8Buffer,
    sectionMetadata.startOffset,
    sectionMetadata.startOffset + oldSizeInBytes.length,
    encodeU32(newSectionSize)
  );
}

export function resizeSectionVecSize(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName,
  deltaElements: number
): Uint8Array {
  const sectionMetadata = getSectionMetadata(ast, section);

  if (typeof sectionMetadata === "undefined") {
    throw new Error("Section metadata not found");
  }

  // Section has no vector
  if (sectionMetadata.vectorOfSize.value === -1) {
    return uint8Buffer;
  }

  // Encode the current value to know the number of bytes to override
  const oldSizeInBytes = encodeU32(sectionMetadata.vectorOfSize.value);

  const newValue = sectionMetadata.vectorOfSize.value + deltaElements;
  const newBytes = encodeU32(newValue);

  const start = sectionMetadata.startOffset + 1;

  // Update AST
  sectionMetadata.vectorOfSize.value = newValue;

  debug(
    "resize vec size section=%s detla=%d newValue=%s",
    section,
    deltaElements,
    newValue
  );

  return overrideBytesInBuffer(
    uint8Buffer,
    start,
    start + oldSizeInBytes.length,
    newBytes
  );
}
