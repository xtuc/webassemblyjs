// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { encodeU32 } from "@webassemblyjs/wasm-gen/lib/encoder";
import {
  isFunc,
  isGlobal,
  assertHasLoc,
  orderedInsertNode,
  getSectionMetadata,
  traverse,
  getEndOfSection,
} from "@webassemblyjs/ast";
import {
  resizeSectionByteSize,
  resizeSectionVecSize,
  createEmptySection,
  removeSections,
} from "@webassemblyjs/helper-wasm-section";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";
import { getSectionForNode } from "@webassemblyjs/helper-wasm-bytecode";
import { define } from "mamacro";

declare function CHECK_END(body: Array<Object>): void;

define(
  CHECK_END,
  (body) => `
    const body = ${body};

    if (body.length === 0 || body[body.length - 1].id !== "end") {
      throw new Error("expressions must be ended");
    }
  `
);

type State = {
  uint8Buffer: Uint8Array,

  deltaBytes: number,
  deltaElements: number,
};

function shiftLocNodeByDelta(node: Node, delta: number) {
  assertHasLoc(node);

  // $FlowIgnore: assertHasLoc ensures that
  node.loc.start.column += delta;
  // $FlowIgnore: assertHasLoc ensures that
  node.loc.end.column += delta;
}

function applyUpdate(
  ast: Program,
  uint8Buffer: Uint8Array,
  [oldNode, newNode]: [Node, Node]
): State {
  const deltaElements = 0;

  assertHasLoc(oldNode);

  const sectionName = getSectionForNode(newNode);
  const replacementByteArray = encodeNode(newNode);

  /**
   * Replace new node as bytes
   */
  uint8Buffer = overrideBytesInBuffer(
    uint8Buffer,
    // $FlowIgnore: assertHasLoc ensures that
    oldNode.loc.start.column,
    // $FlowIgnore: assertHasLoc ensures that
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
          node.body.find((n) => n === newNode) !== undefined;

        // Update func's body size if needed
        if (funcHasThisIntr === true) {
          // These are the old functions locations informations
          assertHasLoc(node);

          const oldNodeSize = encodeNode(oldNode).length;
          const bodySizeDeltaBytes = replacementByteArray.length - oldNodeSize;

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
      },
    });
  }

  /**
   * Update section size
   */
  const deltaBytes =
    replacementByteArray.length -
    // $FlowIgnore: assertHasLoc ensures that
    (oldNode.loc.end.column - oldNode.loc.start.column);

  // Init location informations
  newNode.loc = {
    start: { line: -1, column: -1 },
    end: { line: -1, column: -1 },
  };

  // Update new node end position
  // $FlowIgnore: assertHasLoc ensures that
  newNode.loc.start.column = oldNode.loc.start.column;
  // $FlowIgnore: assertHasLoc ensures that
  newNode.loc.end.column =
    // $FlowIgnore: assertHasLoc ensures that
    oldNode.loc.start.column + replacementByteArray.length;

  return { uint8Buffer, deltaBytes, deltaElements };
}

function applyDelete(ast: Program, uint8Buffer: Uint8Array, node: Node): State {
  const deltaElements = -1; // since we removed an element

  assertHasLoc(node);

  const sectionName = getSectionForNode(node);

  if (sectionName === "start") {
    const sectionMetadata = getSectionMetadata(ast, "start");

    /**
     * The start section only contains one element,
     * we need to remove the whole section
     */
    uint8Buffer = removeSections(ast, uint8Buffer, "start");

    const deltaBytes = -(sectionMetadata.size.value + 1); /* section id */

    return { uint8Buffer, deltaBytes, deltaElements };
  }

  // replacement is nothing
  const replacement = [];

  uint8Buffer = overrideBytesInBuffer(
    uint8Buffer,
    // $FlowIgnore: assertHasLoc ensures that
    node.loc.start.column,
    // $FlowIgnore: assertHasLoc ensures that
    node.loc.end.column,
    replacement
  );

  /**
   * Update section
   */

  // $FlowIgnore: assertHasLoc ensures that
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
   * check that the expressions were ended
   */
  if (isFunc(node)) {
    // $FlowIgnore
    CHECK_END(node.body);
  }

  if (isGlobal(node)) {
    // $FlowIgnore
    CHECK_END(node.init);
  }

  /**
   * Add nodes
   */
  const newByteArray = encodeNode(node);

  // The size of the section doesn't include the storage of the size itself
  // we need to manually add it here
  const start = getEndOfSection(sectionMetadata);

  const end = start;

  /**
   * Update section
   */
  const deltaBytes = newByteArray.length;

  uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, newByteArray);

  node.loc = {
    start: { line: -1, column: start },
    end: { line: -1, column: start + deltaBytes },
  };

  // for func add the additional metadata in the AST
  if (node.type === "Func") {
    // the size is the first byte
    // FIXME(sven): handle LEB128 correctly here
    const bodySize = newByteArray[0];

    node.metadata = { bodySize };
  }

  if (node.type !== "IndexInFuncSection") {
    orderedInsertNode(ast.body[0], node);
  }

  return { uint8Buffer, deltaBytes, deltaElements };
}

export function applyOperations(
  ast: Program,
  uint8Buffer: Uint8Array,
  ops: Array<Operation>
): Uint8Array {
  ops.forEach((op) => {
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
     * Resize section vec size.
     * If the length of the LEB-encoded size changes, this can change
     * the byte length of the section and the offset for nodes in the
     * section. So we do this first before resizing section byte size
     * or shifting following operations' nodes.
     */
    if (state.deltaElements !== 0 && sectionName !== "start") {
      const oldBufferLength = state.uint8Buffer.length;
      state.uint8Buffer = resizeSectionVecSize(
        ast,
        state.uint8Buffer,
        sectionName,
        state.deltaElements
      );
      // Infer bytes added/removed by comparing buffer lengths
      state.deltaBytes += state.uint8Buffer.length - oldBufferLength;
    }

    /**
     * Resize section byte size.
     * If the length of the LEB-encoded size changes, this can change
     * the offset for nodes in the section. So we do this before
     * shifting following operations' nodes.
     */
    if (state.deltaBytes !== 0 && sectionName !== "start") {
      const oldBufferLength = state.uint8Buffer.length;
      state.uint8Buffer = resizeSectionByteSize(
        ast,
        state.uint8Buffer,
        sectionName,
        state.deltaBytes
      );
      // Infer bytes added/removed by comparing buffer lengths
      state.deltaBytes += state.uint8Buffer.length - oldBufferLength;
    }

    /**
     * Shift following operation's nodes
     */
    if (state.deltaBytes !== 0) {
      ops.forEach((op) => {
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
    }

    uint8Buffer = state.uint8Buffer;
  });

  return uint8Buffer;
}
