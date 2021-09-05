// @flow

import {
  traverse,
  getSectionMetadatas,
  shiftSection,
} from "@webassemblyjs/ast";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

export function removeSections(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName
): Uint8Array {
  const sectionMetadatas = getSectionMetadatas(ast, section);

  if (sectionMetadatas.length === 0) {
    throw new Error("Section metadata not found");
  }

  return sectionMetadatas.reverse().reduce((uint8Buffer, sectionMetadata) => {
    const startsIncludingId = sectionMetadata.startOffset - 1;
    const ends =
      section === "start"
        ? sectionMetadata.size.loc.end.column + 1
        : sectionMetadata.startOffset + sectionMetadata.size.value + 1;

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
          shiftSection(ast, path.node, delta);
        }
      },
    });

    // replacement is nothing
    const replacement = [];

    return overrideBytesInBuffer(
      uint8Buffer,
      startsIncludingId,
      ends,
      replacement
    );
  }, uint8Buffer);
}
