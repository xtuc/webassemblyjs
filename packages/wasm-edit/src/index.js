// @flow

import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks } from "@webassemblyjs/ast";
import { cloneNode } from "@webassemblyjs/ast/lib/clone";
import { applyOperations } from "./apply";

function hashNode(node: Node): string {
  return JSON.stringify(node);
}

const decoderOpts = {
  // FIXME(sven): detection based on the Instr doesn't work for add()
  // ignoreCodeSection: true,
  ignoreDataSection: true
};

export function edit(ab: ArrayBuffer, visitors: Object): ArrayBuffer {
  const operations: Array<Operation> = [];

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
  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  const operations = newNodes.map(n => ({
    kind: "add",
    node: n
  }));

  uint8Buffer = applyOperations(ast, uint8Buffer, operations);

  return uint8Buffer.buffer;
}
