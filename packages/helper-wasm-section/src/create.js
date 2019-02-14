// @flow

import { encodeNode, encodeUTF8Vec } from "@webassemblyjs/wasm-gen";
import { assert } from "mamacro";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";
import constants from "@webassemblyjs/helper-wasm-bytecode";
import * as t from "@webassemblyjs/ast";

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

    // Ignore custom section since they can actually occur everywhere
    if (section.section === "custom") {
      continue;
    }

    const sectionId = constants.sections[section.section];

    if (targetSectionId > lastId && targetSectionId < sectionId) {
      return lastSection;
    }

    lastId = sectionId;
    lastSection = section;
  }

  return lastSection;
}

export function createEmptySection(
  ast: Program,
  uint8Buffer: Uint8Array,
  section: SectionName
): Res {
  // previous section after which we are going to insert our section
  const lastSection = findLastSection(ast, section);

  let start, end;

  /**
   * It's the first section
   */
  if (lastSection == null || lastSection.section === "custom") {
    start = 8 /* wasm header size */;
    end = start;
  } else {
    start = lastSection.startOffset + lastSection.size.value + 1;
    end = start;
  }

  // 1 byte for the empty vector
  let size = 1;

  if (section === "custom:producers") {
    size += encodeUTF8Vec("producers").length;
  }
  assert(section !== "custom:name", "not implemented");

  // the section starts after its header
  start += size;

  const sizeStartLoc = { line: -1, column: start };
  const sizeEndLoc = { line: -1, column: start + 1 };

  const vectorOfSizeStartLoc = { line: -1, column: sizeEndLoc.column };
  const vectorOfSizeEndLoc = { line: -1, column: sizeEndLoc.column + 1 };

  const vectorOfSize = t.withLoc(
    t.numberLiteralFromRaw(0),
    vectorOfSizeEndLoc,
    vectorOfSizeStartLoc
  );

  const sectionMetadata = t.sectionMetadata(
    section,
    start,
    t.withLoc(t.numberLiteralFromRaw(size), sizeEndLoc, sizeStartLoc),
    vectorOfSize
  );

  const sectionBytes = encodeNode(sectionMetadata);

  uint8Buffer = overrideBytesInBuffer(
    uint8Buffer,
    start - 1,
    end,
    sectionBytes
  );

  // Add section into the AST for later lookups
  if (typeof ast.body[0].metadata === "object") {
    // $FlowIgnore: metadata can not be empty
    ast.body[0].metadata.sections.push(sectionMetadata);

    t.sortSectionMetadata(ast.body[0]);
  }

  /**
   * Update AST
   */
  // Once we hit our section every that is after needs to be shifted by the delta
  const deltaBytes = +sectionBytes.length;
  let encounteredSection = false;

  t.traverse(ast, {
    SectionMetadata(path) {
      if (path.node.section === section) {
        encounteredSection = true;
        return;
      }

      if (encounteredSection === true) {
        t.shiftSection(ast, path.node, deltaBytes);
      }
    }
  });

  return { uint8Buffer, sectionMetadata };
}
