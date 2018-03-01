// @flow

import { encodeU32 } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata } from "@webassemblyjs/ast";

import { overrideBytesInBuffer } from "./buffer";

export function resizeSectionByteSize(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName,
  deltaBytes: number
) {
  const sectionMetadata = getSectionMetadata(ast, section);

  if (typeof sectionMetadata === "undefined") {
    throw new Error("Section metadata not found");
  }

  const newSectionSize = sectionMetadata.size + deltaBytes;

  // FIXME(sven): works if the section size is an u32 of 1 byte
  return overrideBytesInBuffer(
    uint8Buffer,
    sectionMetadata.startOffset,
    sectionMetadata.startOffset + 1,
    encodeU32(newSectionSize)
  );
}

export function resizeSectionVecSize(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName,
  deltaElements: number
) {
  const sectionMetadata = getSectionMetadata(ast, section);

  if (typeof sectionMetadata === "undefined") {
    throw new Error("Section metadata not found");
  }

  // Section has no vector
  if (sectionMetadata.vectorOfSize === -1) {
    return uint8Buffer;
  }

  const newValue = sectionMetadata.vectorOfSize + deltaElements;
  const newBytes = encodeU32(newValue);

  const start = sectionMetadata.startOffset + 1;

  return overrideBytesInBuffer(uint8Buffer, start, start + 1, newBytes);
}
