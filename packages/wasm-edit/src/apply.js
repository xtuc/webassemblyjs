// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { encodeU32 } from "@webassemblyjs/wasm-gen/lib/encoder";
import { getSectionMetadata, traverse } from "@webassemblyjs/ast";
import {
  resizeSectionByteSize,
  resizeSectionVecSize,
  createEmptySection,
  removeSection,
  getSectionForNode
} from "@webassemblyjs/helper-wasm-section";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

const t = require("@webassemblyjs/ast");

function assertNodeHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: can not replace node (${JSON.stringify(
        n.type
      )}) without loc information`
    );
  }
}

export function applyToNodeToUpdate(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<[Node, Node]>
) {
  nodes.forEach(([oldNode, newNode]) => {
    assertNodeHasLoc(oldNode);

    const sectionName = getSectionForNode(newNode);
    const replacementByteArray = encodeNode(newNode);

    /**
     * Replace new node as bytes
     */
    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      // $FlowIgnore: assertNodeHasLoc ensures that
      oldNode.loc.start.column,
      // $FlowIgnore: assertNodeHasLoc ensures that
      oldNode.loc.end.column,
      replacementByteArray
    );

    /**
     * Update function body size if needed
     */
    if (sectionName === "code") {
      // Find the parent func
      traverse(ast, {
        Func({ node }) {
          const funcHasThisIntr =
            node.body.find(n => n === newNode) !== undefined;

          // Update func's body size if needed
          if (funcHasThisIntr === true) {
            // These are the old functions locations informations
            assertNodeHasLoc(node);

            const oldNodeSize = encodeNode(oldNode).length;
            const bodySizeDeltaBytes =
              replacementByteArray.length - oldNodeSize;

            if (bodySizeDeltaBytes !== 0) {
              const newValue = node.metadata.bodySize + bodySizeDeltaBytes;
              const newByteArray = encodeU32(newValue);

              // function body size byte
              // FIXME(sven): only handles one byte u32
              const start = node.loc.start.column;
              const end = start + 1;

              uint8Buffer = overrideBytesInBuffer(
                uint8Buffer,
                start,
                end,
                newByteArray
              );
            }
          }
        }
      });
    }

    /**
     * Update section size
     */
    const deltaBytes =
      replacementByteArray.length -
      // $FlowIgnore: assertNodeHasLoc ensures that
      (oldNode.loc.end.column - oldNode.loc.start.column);

    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    // Init location informations
    newNode.loc = {
      start: { line: -1, column: -1 },
      end: { line: -1, column: -1 }
    };

    // Update new node end position
    // $FlowIgnore: assertNodeHasLoc ensures that
    newNode.loc.start.column = oldNode.loc.start.column;
    newNode.loc.end.column =
      // $FlowIgnore: assertNodeHasLoc ensures that
      oldNode.loc.start.column + replacementByteArray.length;
  });

  return uint8Buffer;
}

export function applyToNodeToDelete(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  const deltaElements = -1; // since we removed an element

  nodes.forEach(node => {
    assertNodeHasLoc(node);

    const sectionName = getSectionForNode(node);

    if (sectionName === "start") {
      /**
       * The start section only contains one element,
       * we need to remove the whole section
       */

      uint8Buffer = removeSection(ast, uint8Buffer, "start");
      return;
    }

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

    /**
     * Update section
     */

    // $FlowIgnore: assertNodeHasLoc ensures that
    const deltaBytes = -(node.loc.end.column - node.loc.start.column);

    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    uint8Buffer = resizeSectionVecSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaElements
    );
  });

  return uint8Buffer;
}

export function applyToNodeToAdd(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  const deltaElements = +1; // since we added an element

  nodes.forEach(node => {
    const sectionName = getSectionForNode(node);

    let sectionMetadata = getSectionMetadata(ast, sectionName);

    // Section doesn't exists, we create an empty one
    if (typeof sectionMetadata === "undefined") {
      const res = createEmptySection(ast, uint8Buffer, sectionName);

      uint8Buffer = res.uint8Buffer;
      sectionMetadata = res.sectionMetadata;
    }

    /**
     * Add nodes
     */
    const newByteArray = encodeNode(node);

    // start at the end of the section
    const start = sectionMetadata.startOffset + sectionMetadata.size + 1;

    const end = start;

    uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, newByteArray);

    /**
     * Update section
     */
    const deltaBytes = newByteArray.length;

    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    uint8Buffer = resizeSectionVecSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaElements
    );
  });

  return uint8Buffer;
}
