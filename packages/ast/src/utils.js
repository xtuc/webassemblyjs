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

export function isInstruction(n: Node) {
  return (
    n.type === "Instr" ||
    n.type === "CallInstruction" ||
    n.type === "CallIndirectInstruction" ||
    n.type === "BlockInstruction" ||
    n.type === "LoopInstruction" ||
    n.type === "IfInstruction"
  );
}

export function orderedInsertNode(m: Module, n: Node) {
  // FIXME(sven): this is duplicated
  const assertNodeHasLoc = n => {
    if (n.loc == null) throw new Error("Missing loc location");
  };

  assertNodeHasLoc(n);

  let didInsert = false;

  m.fields = m.fields.reduce((acc, field) => {
    assertNodeHasLoc(field);

    // $FlowIgnore: assertNodeHasLoc ensures that
    const fieldEndCol = field.loc.end.column;

    // $FlowIgnore: assertNodeHasLoc ensures that
    if (n.loc.start.column < fieldEndCol) {
      didInsert = true;
      acc.push(n);
    }

    acc.push(field);

    return acc;
  }, []);

  // Handles empty modules or n is the last element
  if (didInsert === false) {
    m.fields.push(n);
  }
}
