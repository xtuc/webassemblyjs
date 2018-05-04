// @flow

import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks } from "@webassemblyjs/ast";
import { cloneNode } from "@webassemblyjs/ast/lib/clone";
import { shrinkPaddedLEB128 } from "@webassemblyjs/wasm-opt";
import { getSectionForNode } from "@webassemblyjs/helper-wasm-section";
import constants from "@webassemblyjs/helper-wasm-bytecode";

import { applyOperations } from "./apply";

function hashNode(node: Node): string {
  return JSON.stringify(node);
}

const decoderOpts = {
  // FIXME(sven): detection based on the Instr doesn't work for add()
  // ignoreCodeSection: true,
  ignoreDataSection: true
};

function preprocess(ab: ArrayBuffer): ArrayBuffer {
  const optBin = shrinkPaddedLEB128(new Uint8Array(ab));
  return optBin.buffer;
}

function sortBySectionOrder(nodes: Array<Node>) {
  nodes.sort((a, b) => {
    const sectionA = getSectionForNode(a);
    const sectionB = getSectionForNode(b);

    const aId = constants.sections[sectionA];
    const bId = constants.sections[sectionB];

    if (typeof aId !== "number" || typeof bId !== "number") {
      throw new Error("Section id not found");
    }

    // $FlowIgnore ensured above
    return aId > bId;
  });
}

export function edit(ab: ArrayBuffer, visitors: Object): ArrayBuffer {
  const operations: Array<Operation> = [];

  ab = preprocess(ab);

  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  let nodeBefore;

  function before(type: string, path: NodePath<*>) {
    nodeBefore = cloneNode(path.node);
  }

  function after(type: string, path: NodePath<*>) {
    if (path.node._deleted === true) {
      operations.push({
        kind: "delete",
        node: path.node
      });
      // $FlowIgnore
    } else if (hashNode(nodeBefore) !== hashNode(path.node)) {
      operations.push({
        kind: "update",
        oldNode: nodeBefore,
        node: path.node
      });
    }
  }

  traverseWithHooks(ast, visitors, before, after);

  uint8Buffer = applyOperations(ast, uint8Buffer, operations);

  return uint8Buffer.buffer;
}

export function add(ab: ArrayBuffer, newNodes: Array<Node>): ArrayBuffer {
  ab = preprocess(ab);

  // Sort nodes by insertion order
  sortBySectionOrder(newNodes);

  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  // Map node into operations
  const operations = newNodes.map(n => ({
    kind: "add",
    node: n
  }));

  uint8Buffer = applyOperations(ast, uint8Buffer, operations);

  return uint8Buffer.buffer;
}
