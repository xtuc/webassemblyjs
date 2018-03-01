// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";

import { resizeSectionByteSize, resizeSectionVecSize } from "./section";
import { overrideBytesInBuffer } from "./buffer";

function assertNodeHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: can not replace n (${n.type}) without loc information`
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

    // FIXME(sven): update new node locations
    // end = start + replacementByteArray.length

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
    const deltaElements = -1; // since we removed on element

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
