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

const debug = require("debug")("wasm");

type State = {
  uint8Buffer: Uint8Array,

  deltaBytes: number,
  deltaElements: number
};

function assertNodeHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: can not replace node (${JSON.stringify(
        n.type
      )}) without loc information`
    );
  }
}

function shiftLocNodeByDelta(node: Node, delta: number) {
  assertNodeHasLoc(node);

  // $FlowIgnore: assertNodeHasLoc ensures that
  node.loc.start.column += delta;
  // $FlowIgnore: assertNodeHasLoc ensures that
  node.loc.end.column += delta;
}

function applyUpdate(
  ast: Program,
  uint8Buffer: Uint8Array,
  [oldNode, newNode]: [Node, Node]
): State {
  const deltaElements = 0;

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
          const bodySizeDeltaBytes = replacementByteArray.length - oldNodeSize;

          if (bodySizeDeltaBytes !== 0) {
            const newValue = node.metadata.bodySize + bodySizeDeltaBytes;
            const newByteArray = encodeU32(newValue);

            debug("resize func body newValue=%d", newValue);

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

  // Init location informations
  newNode.loc = {
    start: { line: -1, column: -1 },
    end: { line: -1, column: -1 }
  };

  // Update new node end position
  // $FlowIgnore: assertNodeHasLoc ensures that
  newNode.loc.start.column = oldNode.loc.start.column;
  // $FlowIgnore: assertNodeHasLoc ensures that
  newNode.loc.end.column =
    // $FlowIgnore: assertNodeHasLoc ensures that
    oldNode.loc.start.column + replacementByteArray.length;

  return { uint8Buffer, deltaBytes, deltaElements };
}

function applyDelete(ast: Program, uint8Buffer: Uint8Array, node: Node): State {
  const deltaElements = -1; // since we removed an element

  assertNodeHasLoc(node);

  const sectionName = getSectionForNode(node);

  if (sectionName === "start") {
    const sectionMetadata = getSectionMetadata(ast, "start");

    /**
     * The start section only contains one element,
     * we need to remove the whole section
     */
    uint8Buffer = removeSection(ast, uint8Buffer, "start");

    const deltaBytes = -(sectionMetadata.size.value + 1) /* section id */;

    return { uint8Buffer, deltaBytes, deltaElements };
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

  return { uint8Buffer, deltaBytes, deltaElements };
}

function applyAdd(ast: Program, uint8Buffer: Uint8Array, node: Node): State {
  const deltaElements = +1; // since we added an element

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

  // The size of the section doesn't include the storage of the size itself
  // we need to manually add it here
  // FIXME(sven): preprocess it into the AST?
  const start =
    sectionMetadata.startOffset +
    sectionMetadata.size.value +
    (sectionMetadata.size.loc.end.column -
      sectionMetadata.size.loc.start.column);

  const end = start;

  uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, newByteArray);

  /**
   * Update section
   */
  const deltaBytes = newByteArray.length;

  debug(
    "add node=%s section=%s after=%d deltaBytes=%s deltaElements=%s",
    node.type,
    sectionName,
    start,
    deltaBytes,
    deltaElements
  );

  return { uint8Buffer, deltaBytes, deltaElements };
}

export function applyOperations(
  ast: Program,
  uint8Buffer: Uint8Array,
  ops: Array<Operation>
): Uint8Array {
  ops.forEach(op => {
    let state;
    let sectionName;

    switch (op.kind) {
      case "update":
        state = applyUpdate(ast, uint8Buffer, [op.oldNode, op.node]);
        sectionName = getSectionForNode(op.node);
        break;

      case "delete":
        state = applyDelete(ast, uint8Buffer, op.node);
        sectionName = getSectionForNode(op.node);
        break;

      case "add":
        state = applyAdd(ast, uint8Buffer, op.node);
        sectionName = getSectionForNode(op.node);
        break;

      default:
        throw new Error("Unknown operation");
    }

    /**
     * Shift following operation's nodes
     */
    if (state.deltaBytes !== 0) {
      ops.forEach(op => {
        // We don't need to handle add ops, they are positioning independent
        switch (op.kind) {
          case "update":
            shiftLocNodeByDelta(op.oldNode, state.deltaBytes);
            break;

          case "delete":
            shiftLocNodeByDelta(op.node, state.deltaBytes);
            break;
        }
      });

      if (sectionName !== "start") {
        state.uint8Buffer = resizeSectionByteSize(
          ast,
          state.uint8Buffer,
          sectionName,
          state.deltaBytes
        );
      }
    }

    if (state.deltaElements !== 0 && sectionName !== "start") {
      state.uint8Buffer = resizeSectionVecSize(
        ast,
        state.uint8Buffer,
        sectionName,
        state.deltaElements
      );
    }

    uint8Buffer = state.uint8Buffer;
  });

  return uint8Buffer;
}
