// @flow

import { traverse, getSectionMetadata } from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

const debug = require("debug")("wasm:removesection");

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

  const delta = -(ends - startsIncludingId);

  /**
   * update AST
   */

  // Once we hit our section every that is after needs to be shifted by the delta
  let encounteredSection = false;

  traverse(ast, {
    SectionMetadata(path) {
      if (path.node.section === section) {
        encounteredSection = true;
        return path.remove();
      }

      if (encounteredSection === true) {
        path.shift(delta);

        debug("shift section section=%s detla=%d", section, delta);
      }
    }
  });

  return overrideBytesInBuffer(
    uint8Buffer,
    startsIncludingId,
    ends,
    replacement
  );
}
