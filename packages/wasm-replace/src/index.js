// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks } from "@webassemblyjs/ast";

function concatUint8Arrays(...arrays: Array<Uint8Array>) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function hashPath({ node }: NodePath<*>): string {
  return JSON.stringify(node);
}

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true
};

export function replaceInBinary(
  ab: ArrayBuffer,
  visitors: Object
): ArrayBuffer {
  const nodesToUpdate = [];

  // FIXME(sven): we are parsing two times the binary?
  const ast = decode(ab, decoderOpts);

  let uint8Buffer = new Uint8Array(ab);

  let nodeBeforeHash = "";

  function before(type: string, path: NodePath<*>) {
    nodeBeforeHash = hashPath(path);
  }

  function after(type: string, path: NodePath<*>) {
    if (nodeBeforeHash !== hashPath(path)) {
      nodesToUpdate.push(path.node);
    }
  }

  traverseWithHooks(ast, visitors, before, after);

  nodesToUpdate.forEach(node => {
    if (node.loc == null) {
      throw new Error(
        "Internal failure: can not update replace node without loc information"
      );
    }

    const beforeBytes = uint8Buffer.slice(0, node.loc.start.column);
    const afterBytes = uint8Buffer.slice(node.loc.end.column, ab.byteLength);

    const replacementByteArray = encodeNode(node);

    uint8Buffer = concatUint8Arrays(
      beforeBytes,
      Uint8Array.from(replacementByteArray),
      afterBytes
    );
  });

  return uint8Buffer.buffer;
}
