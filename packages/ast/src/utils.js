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
  assertHasLoc(n);

  let didInsert = false;

  if (n.type === "ModuleExport") {
    m.fields.push(n);
    return;
  }

  m.fields = m.fields.reduce((acc, field) => {
    assertHasLoc(field);

    // $FlowIgnore: assertHasLoc ensures that
    const fieldEndCol = field.loc.end.column;

    // $FlowIgnore: assertHasLoc ensures that
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

export function assertHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: node (${JSON.stringify(
        n.type
      )}) has no location information`
    );
  }
}

export function getEndOfSection(s: SectionMetadata): number {
  assertHasLoc(s.size);

  return (
    s.startOffset +
    s.size.value +
    // $FlowIgnore
    (s.size.loc.end.column - s.size.loc.start.column)
  );
}
