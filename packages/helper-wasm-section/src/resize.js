// @flow

import { encodeU32 } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata, traverse } from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

const debug = require("debug")("wasm:resizesection");

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

  if (typeof sectionMetadata.size.loc === "undefined") {
    throw new Error("SectionMetadata " + section + " has no loc");
  }

  // keep old node location to be overriden
  const start = sectionMetadata.size.loc.start.column;
  const end = sectionMetadata.size.loc.end.column;

  const newSectionSize = sectionMetadata.size.value + deltaBytes;
  const newBytes = encodeU32(newSectionSize);

  /**
   * update AST
   */
  sectionMetadata.size.value = newSectionSize;

  const oldu32EncodedLen = end - start;
  const newu32EncodedLen = newBytes.length;

  // the new u32 has a different encoded length
  if (newu32EncodedLen !== oldu32EncodedLen) {
    const deltaInSizeEncoding = newu32EncodedLen - oldu32EncodedLen;

    sectionMetadata.size.loc.end.column = start + newu32EncodedLen;

    deltaBytes += deltaInSizeEncoding;

    // move the vec size pointer size the section size is now smaller
    sectionMetadata.vectorOfSize.loc.start.column += deltaInSizeEncoding;
    sectionMetadata.vectorOfSize.loc.end.column += deltaInSizeEncoding;
  }

  // Once we hit our section every that is after needs to be shifted by the delta
  let encounteredSection = false;

  traverse(ast, {
    SectionMetadata(path) {
      if (path.node.section === section) {
        encounteredSection = true;
        return;
      }

      if (encounteredSection === true) {
        path.shift(deltaBytes);

        debug(
          "shift section section=%s detla=%d",
          path.node.section,
          deltaBytes
        );
      }
    }
  });

  debug(
    "resize byte size section=%s newValue=%s start=%d end=%d",
    section,
    newSectionSize,
    start,
    end
  );

  return overrideBytesInBuffer(uint8Buffer, start, end, newBytes);
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

  if (typeof sectionMetadata.vectorOfSize.loc === "undefined") {
    throw new Error("SectionMetadata " + section + " has no loc");
  }

  // Section has no vector
  if (sectionMetadata.vectorOfSize.value === -1) {
    return uint8Buffer;
  }

  // keep old node location to be overriden
  const start = sectionMetadata.vectorOfSize.loc.start.column;
  const end = sectionMetadata.vectorOfSize.loc.end.column;

  const newValue = sectionMetadata.vectorOfSize.value + deltaElements;
  const newBytes = encodeU32(newValue);

  // Update AST
  sectionMetadata.vectorOfSize.value = newValue;
  sectionMetadata.vectorOfSize.loc.end.column = start + newBytes.length;

  debug(
    "resize vec size section=%s detla=%d newValue=%s",
    section,
    deltaElements,
    newValue
  );

  return overrideBytesInBuffer(uint8Buffer, start, end, newBytes);
}
