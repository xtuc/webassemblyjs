// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

const t = require("@webassemblyjs/ast");

type Res = { uint8Buffer: Uint8Array, sectionMetadata: SectionMetadata };

export function createEmptySection(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName
): Res {
  const start = uint8Buffer.length;
  const end = start;

  const size = 1; // 1 byte because of the empty vector
  const vectorOfSize = 0;

  const sectionMetadata = t.sectionMetadata(
    section,
    start + 1, // Ignore the section id in the AST
    size,
    vectorOfSize
  );

  const sectionBytes = encodeNode(sectionMetadata);

  // FIXME(sven): sections must have a specific order, for now append it
  uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, sectionBytes);

  // Add section into the AST for later lookups
  if (typeof ast.body[0].metadata === "object") {
    // $FlowIgnore: metadata can not be empty
    ast.body[0].metadata.sections.push(sectionMetadata);
  }

  return { uint8Buffer, sectionMetadata };
}
