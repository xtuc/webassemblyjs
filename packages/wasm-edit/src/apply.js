// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata } from "@webassemblyjs/ast";

import { resizeSectionByteSize, resizeSectionVecSize } from "./section";
import { overrideBytesInBuffer } from "./buffer";

const t = require("@webassemblyjs/ast");

function assertNodeHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: can not replace node (${
        n.type
      }) without loc information`
    );
  }
}

export function applyToNodeToUpdate(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  nodes.forEach(node => {
    assertNodeHasLoc(node);

    const replacementByteArray = encodeNode(node);

    /**
     * Replace new node as bytes
     */
    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.start.column,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.end.column,
      replacementByteArray
    );

    /**
     * Update section size
     */
    const deltaBytes =
      replacementByteArray.length -
      // $FlowIgnore: assertNodeHasLoc ensures that
      (node.loc.end.column - node.loc.start.column);

    if (node.type === "ModuleImport") {
      uint8Buffer = resizeSectionByteSize(
        ast,
        uint8Buffer,
        "import",
        deltaBytes
      );
    }

    // Update new node end position
    // $FlowIgnore: assertNodeHasLoc ensures that
    node.loc.end.column = node.loc.start.column + replacementByteArray.length;
  });

  return uint8Buffer;
}

export function applyToNodeToDelete(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  nodes.forEach(node => {
    assertNodeHasLoc(node);

    // replacement is nothing
    const replacement = [];

    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.start.column,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.end.column,
      replacement
    );

    // Update section size
    // $FlowIgnore: assertNodeHasLoc ensures that
    const deltaBytes = -(node.loc.end.column - node.loc.start.column);
    const deltaElements = -1; // since we removed an element

    if (node.type === "ModuleExport") {
      uint8Buffer = resizeSectionByteSize(
        ast,
        uint8Buffer,
        "export",
        deltaBytes
      );

      uint8Buffer = resizeSectionVecSize(
        ast,
        uint8Buffer,
        "export",
        deltaElements
      );
    }
  });

  return uint8Buffer;
}

export function applyToNodeToAdd(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  nodes.forEach(node => {
    const deltaElements = +1; // since we added an element

    if (node.type === "ModuleImport") {
      let sectionMetadata = getSectionMetadata(ast, "import");

      // Section doesn't exists, we create an empty one
      if (typeof sectionMetadata === "undefined") {
        const start = uint8Buffer.length;
        const end = start;

        const size = 1; // 1 byte because of the empty vector
        const vectorOfSize = 0;

        sectionMetadata = t.sectionMetadata(
          "import",
          start + 1, // Ignore the section id in the AST
          size,
          vectorOfSize
        );

        const sectionBytes = encodeNode(sectionMetadata);

        // FIXME(sven): sections must have a specific order, for now append it
        uint8Buffer = overrideBytesInBuffer(
          uint8Buffer,
          start,
          end,
          sectionBytes
        );

        // Add section into the AST for later lookups
        if (typeof ast.body[0].metadata === "object") {
          // $FlowIgnore: metadata can not be empty
          ast.body[0].metadata.sections.push(sectionMetadata);
        }
      }

      /**
       * Add nodes
       */
      const newByteArray = encodeNode(node);

      // start at the end of the section
      const start = sectionMetadata.startOffset + sectionMetadata.size + 1;

      const end = start;

      uint8Buffer = overrideBytesInBuffer(
        uint8Buffer,
        start,
        end,
        newByteArray
      );

      const deltaBytes = newByteArray.length;

      /**
       * Update section
       */
      uint8Buffer = resizeSectionByteSize(
        ast,
        uint8Buffer,
        "import",
        deltaBytes
      );

      uint8Buffer = resizeSectionVecSize(
        ast,
        uint8Buffer,
        "import",
        deltaElements
      );
    } else {
      throw new Error("Unsupport operation: insert node of type: " + node.type);
    }
  });

  return uint8Buffer;
}
