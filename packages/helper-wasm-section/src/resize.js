// @flow

import { encodeU32 } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata } from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

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
  const oldSizeInBytes = encodeU32(sectionMetadata.size);

  const newSectionSize = sectionMetadata.size + deltaBytes;

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
  if (sectionMetadata.vectorOfSize === -1) {
    return uint8Buffer;
  }

  // Encode the current value to know the number of bytes to override
  const oldSizeInBytes = encodeU32(sectionMetadata.vectorOfSize);

  const newValue = sectionMetadata.vectorOfSize + deltaElements;
  const newBytes = encodeU32(newValue);

  const start = sectionMetadata.startOffset + 1;

  return overrideBytesInBuffer(
    uint8Buffer,
    start,
    start + oldSizeInBytes.length,
    newBytes
  );
}
