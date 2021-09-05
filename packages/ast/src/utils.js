// @flow

import { signatures } from "./signatures";
import { traverse } from "./traverse";
import constants from "@webassemblyjs/helper-wasm-bytecode";
import { getSectionForNode } from "@webassemblyjs/helper-wasm-bytecode";
import { assert } from "mamacro";

export function isAnonymous(ident: Identifier): boolean {
  return ident.raw === "";
}

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
    },
  });

  return section;
}

export function getSectionMetadatas(
  ast: Node,
  name: SectionName
): Array<SectionMetadata> {
  const sections = [];

  traverse(ast, {
    SectionMetadata({ node }: NodePath<SectionMetadata>) {
      if (node.section === name) {
        sections.push(node);
      }
    },
  });

  return sections;
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

    return aId - bId;
  });
}

export function orderedInsertNode(m: Module, n: Node) {
  assertHasLoc(n);

  let didInsert = false;

  if (n.type === "ModuleExport") {
    m.fields.push(n);
    return;
  }

  m.fields = m.fields.reduce((acc, field) => {
    let fieldEndCol = Infinity;

    if (field.loc != null) {
      // $FlowIgnore
      fieldEndCol = field.loc.end.column;
    }

    // $FlowIgnore: assertHasLoc ensures that
    if (didInsert === false && n.loc.start.column < fieldEndCol) {
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

export function shiftLoc(node: Node, delta: number) {
  // $FlowIgnore
  node.loc.start.column += delta;
  // $FlowIgnore
  node.loc.end.column += delta;
}

export function shiftSection(
  ast: Program,
  node: SectionMetadata,
  delta: number
) {
  if (node.type !== "SectionMetadata") {
    throw new Error("Can not shift node " + JSON.stringify(node.type));
  }

  node.startOffset += delta;

  if (typeof node.size.loc === "object") {
    shiftLoc(node.size, delta);
  }

  // Custom sections doesn't have vectorOfSize
  if (
    typeof node.vectorOfSize === "object" &&
    typeof node.vectorOfSize.loc === "object"
  ) {
    shiftLoc(node.vectorOfSize, delta);
  }

  const sectionName = node.section;

  // shift node locations within that section
  traverse(ast, {
    Node({ node }) {
      const section = getSectionForNode(node);

      if (section === sectionName && typeof node.loc === "object") {
        shiftLoc(node, delta);
      }
    },
  });
}

export function signatureForOpcode(object: string, name: string): SignatureMap {
  let opcodeName = name;
  if (object !== undefined && object !== "") {
    opcodeName = object + "." + name;
  }
  const sign = signatures[opcodeName];
  if (sign == undefined) {
    // TODO: Uncomment this when br_table and others has been done
    //throw new Error("Invalid opcode: "+opcodeName);
    return [object, object];
  }

  return sign[0];
}

export function getUniqueNameGenerator(): (string) => string {
  const inc = {};
  return function (prefix: string = "temp"): string {
    if (!(prefix in inc)) {
      inc[prefix] = 0;
    } else {
      inc[prefix] = inc[prefix] + 1;
    }
    return prefix + "_" + inc[prefix];
  };
}

export function getStartByteOffset(n: Node): number {
  // $FlowIgnore
  if (typeof n.loc === "undefined" || typeof n.loc.start === "undefined") {
    throw new Error(
      // $FlowIgnore
      "Can not get byte offset without loc informations, node: " + String(n.id)
    );
  }

  return n.loc.start.column;
}

export function getEndByteOffset(n: Node): number {
  // $FlowIgnore
  if (typeof n.loc === "undefined" || typeof n.loc.end === "undefined") {
    throw new Error(
      "Can not get byte offset without loc informations, node: " + n.type
    );
  }

  return n.loc.end.column;
}

export function getFunctionBeginingByteOffset(n: Func): number {
  assert(n.body.length > 0);

  const [firstInstruction] = n.body;

  return getStartByteOffset(firstInstruction);
}

export function getEndBlockByteOffset(n: Block): number {
  // $FlowIgnore
  assert(n.instr.length > 0 || n.body.length > 0);

  let lastInstruction;

  if (n.instr) {
    // $FlowIgnore
    lastInstruction = n.instr[n.instr.length - 1];
  }

  if (n.body) {
    // $FlowIgnore
    lastInstruction = n.body[n.body.length - 1];
  }

  assert(typeof lastInstruction === "object");

  // $FlowIgnore
  return getStartByteOffset(lastInstruction);
}

export function getStartBlockByteOffset(n: Block): number {
  // $FlowIgnore
  assert(n.instr.length > 0 || n.body.length > 0);

  let fistInstruction;

  if (n.instr) {
    // $FlowIgnore
    [fistInstruction] = n.instr;
  }

  if (n.body) {
    // $FlowIgnore
    [fistInstruction] = n.body;
  }

  assert(typeof fistInstruction === "object");

  // $FlowIgnore
  return getStartByteOffset(fistInstruction);
}
