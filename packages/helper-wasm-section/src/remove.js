// @flow

import { getSectionMetadata } from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

export function removeSection(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName
): Uint8Array {
  const sectionMetadata = getSectionMetadata(ast, section);

  if (typeof sectionMetadata === "undefined") {
    throw new Error("Section metadata not found");
  }

  // replacement is nothing
  const replacement = [];

  const startsIncludingId = sectionMetadata.startOffset - 1;
  const ends = sectionMetadata.startOffset + sectionMetadata.size.value + 1;

  return overrideBytesInBuffer(
    uint8Buffer,
    startsIncludingId,
    ends,
    replacement
  );
}
