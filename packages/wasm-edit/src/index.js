// @flow

import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks } from "@webassemblyjs/ast";
import {
  applyToNodeToDelete,
  applyToNodeToUpdate,
  applyToNodeToAdd
} from "./apply";

function hashPath({ node }: NodePath<*>): string {
  return JSON.stringify(node);
}

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true
};

export function edit(ab: ArrayBuffer, visitors: Object): ArrayBuffer {
  const nodesToDelete = [];
  const nodesToUpdate = [];

  if (typeof visitors.Instr === "function") {
    decoderOpts.ignoreCodeSection = false;

    console.warn("Decoding the code section has been enabled.");
  }

  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  let nodeBeforeHash = "";

  function before(type: string, path: NodePath<*>) {
    nodeBeforeHash = hashPath(path);
  }

  function after(type: string, path: NodePath<*>) {
    if (path.node._deleted === true) {
      nodesToDelete.push(path.node);
    } else if (nodeBeforeHash !== hashPath(path)) {
      nodesToUpdate.push(path.node);
    }
  }

  traverseWithHooks(ast, visitors, before, after);

  uint8Buffer = applyToNodeToUpdate(ast, uint8Buffer, nodesToUpdate);
  uint8Buffer = applyToNodeToDelete(ast, uint8Buffer, nodesToDelete);

  return uint8Buffer.buffer;
}

export function add(ab: ArrayBuffer, newNodes: Array<Node>): ArrayBuffer {
  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  uint8Buffer = applyToNodeToAdd(ast, uint8Buffer, newNodes);

  return uint8Buffer.buffer;
}
