// @flow

import { traverse } from "./traverse";
import constants from "@webassemblyjs/helper-wasm-bytecode";

export function getSectionMetadata(
  ast: Node,
  name: SectionName
): ?SectionMetadata {
  let section;

  traverse(ast, {
    SectionMetadata({ node }: NodePath<SectionMetadata>) {
      if (node.section === name) {
        section = node;
      }
    }
  });

  return section;
}

export function sortSectionMetadata(m: Module) {
  if (m.metadata == null) {
    console.warn("sortSectionMetadata: no metadata to sort");
    return;
  }

  // $FlowIgnore
  m.metadata.sections.sort((a, b) => {
    const aId = constants.sections[a.section];
    const bId = constants.sections[b.section];

    if (typeof aId !== "number" || typeof bId !== "number") {
      throw new Error("Section id not found");
    }

    return aId > bId;
  });
}
