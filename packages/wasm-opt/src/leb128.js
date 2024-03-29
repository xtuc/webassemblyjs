// @flow

import { traverse, shiftSection } from "@webassemblyjs/ast";
import { encodeU32 } from "@webassemblyjs/wasm-gen/lib/encoder";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

function shiftFollowingSections(ast, { section }, deltaInSizeEncoding) {
  // Once we hit our section every that is after needs to be shifted by the delta
  let encounteredSection = false;

  traverse(ast, {
    SectionMetadata(path) {
      if (path.node.section === section) {
        encounteredSection = true;
        return;
      }

      if (encounteredSection === true) {
        shiftSection(ast, path.node, deltaInSizeEncoding);
      }
    },
  });
}

export function shrinkPaddedLEB128(
  ast: Program,
  uint8Buffer: Uint8Array
): Uint8Array {
  traverse(ast, {
    SectionMetadata({ node }) {
      /**
       * Section size
       */
      {
        const newu32Encoded = encodeU32(node.size.value);
        const newu32EncodedLen = newu32Encoded.length;

        const start = node.size.loc.start.column;
        const end = node.size.loc.end.column;

        const oldu32EncodedLen = end - start;

        if (newu32EncodedLen !== oldu32EncodedLen) {
          const deltaInSizeEncoding = oldu32EncodedLen - newu32EncodedLen;

          uint8Buffer = overrideBytesInBuffer(
            uint8Buffer,
            start,
            end,
            newu32Encoded
          );

          shiftFollowingSections(ast, node, -deltaInSizeEncoding);
        }
      }
    },
  });

  return uint8Buffer;
}
