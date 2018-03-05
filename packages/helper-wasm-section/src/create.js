// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";
import constants from "@webassemblyjs/helper-wasm-bytecode";

const t = require("@webassemblyjs/ast");

type Res = { uint8Buffer: Uint8Array, sectionMetadata: SectionMetadata };

function findLastSection(
  ast: Program,
  forSection: SectionName
): ?SectionMetadata {
  const targetSectionId = constants.sections[forSection];

  // $FlowIgnore: metadata can not be empty
  const moduleSections = ast.body[0].metadata.sections;

  let lastSection;
  let lastId = 0;

  for (let i = 0, len = moduleSections.length; i < len; i++) {
    const section = moduleSections[i];
    const sectionId = constants.sections[section.section];

    if (targetSectionId > lastId && targetSectionId < sectionId) {
      return lastSection;
    }

    lastId = sectionId;
    lastSection = section;
  }
}

export function createEmptySection(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName
): Res {
  // previous section after which we are going to insert our section
  const lastSection = findLastSection(ast, section);

  let start, end;

  if (lastSection == null) {
    /**
     * It's the first section
     */
    start = 8 /* wasm header size */;
    end = start;
  } else {
    start = lastSection.startOffset + lastSection.size + 1;
    end = start;
  }

  const size = 1; // empty vector
  const vectorOfSize = 0;

  const sectionMetadata = t.sectionMetadata(
    section,
    start + 1, // ignore the section id from the AST
    size,
    vectorOfSize
  );

  const sectionBytes = encodeNode(sectionMetadata);

  uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, sectionBytes);

  // Add section into the AST for later lookups
  if (typeof ast.body[0].metadata === "object") {
    // $FlowIgnore: metadata can not be empty
    ast.body[0].metadata.sections.push(sectionMetadata);
  }

  return { uint8Buffer, sectionMetadata };
}
