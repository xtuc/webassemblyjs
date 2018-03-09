// @flow

import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks } from "@webassemblyjs/ast";
import { cloneNode } from "@webassemblyjs/ast/lib/clone";
import {
  applyToNodeToDelete,
  applyToNodeToUpdate,
  applyToNodeToAdd
} from "./apply";

function hashNode(node: Node): string {
  return JSON.stringify(node);
}

const decoderOpts = {
  // FIXME(sven): detection based on the Instr doesn't work for add()
  // ignoreCodeSection: true,
  ignoreDataSection: true
};

export function edit(ab: ArrayBuffer, visitors: Object): ArrayBuffer {
  const nodesToDelete = [];
  const nodesToUpdate: Array<[Node /* old */, Node /* new */]> = [];

  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  let nodeBefore;

  function before(type: string, path: NodePath<*>) {
    nodeBefore = cloneNode(path.node);
  }

  function after(type: string, path: NodePath<*>) {
    if (path.node._deleted === true) {
      nodesToDelete.push(path.node);
      // $FlowIgnore
    } else if (hashNode(nodeBefore) !== hashNode(path.node)) {
      nodesToUpdate.push([nodeBefore, path.node]);
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
