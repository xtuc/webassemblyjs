// @flow

import { traverse } from "./traverse";

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
