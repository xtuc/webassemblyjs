// @flow

import { encodeNode, encodeU32 } from "@webassemblyjs/wasm-gen";
import { decode } from "@webassemblyjs/wasm-parser";
import { traverseWithHooks, getSectionMetadata } from "@webassemblyjs/ast";

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

export function overrideBytesInBuffer(
  buffer: Uint8Array,
  startLoc: number,
  endLoc: number,
  newBytes: Array<Byte>
): Uint8Array {
  const beforeBytes = buffer.slice(0, startLoc);
  const afterBytes = buffer.slice(endLoc, buffer.length);

  const replacement = Uint8Array.from(newBytes);

  return concatUint8Arrays(beforeBytes, replacement, afterBytes);
}

export function replaceInBinary(
  ab: ArrayBuffer,
  visitors: Object
): ArrayBuffer {
  const nodesToUpdate = [];

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

    const replacementByteArray = encodeNode(node);

    /**
     * Replace new node as bytes
     */
    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      node.loc.start.column,
      node.loc.end.column,
      replacementByteArray
    );

    /**
     * Update section size
     */
    if (node.type === "ModuleImport") {
      const sectionMetadata = getSectionMetadata(ast, "import");

      if (typeof sectionMetadata === "undefined") {
        throw new Error("Section metadata not found");
      }

      const addedBytes =
        replacementByteArray.length -
        (node.loc.end.column - node.loc.start.column);

      const newSectionSize = sectionMetadata.size + addedBytes;

      // FIXME(sven): works if the section size is an u32 of 1 byte
      uint8Buffer = overrideBytesInBuffer(
        uint8Buffer,
        sectionMetadata.startOffset,
        sectionMetadata.startOffset + 1,
        encodeU32(newSectionSize)
      );

      console.log(sectionMetadata);
    }
  });

  return uint8Buffer.buffer;
}
