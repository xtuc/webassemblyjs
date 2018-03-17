// @flow

import { decode } from "@webassemblyjs/wasm-parser";
import { removeSection } from "@webassemblyjs/helper-wasm-section";

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true
};

export default function strip(bin: ArrayBuffer): ArrayBuffer {
  const ast = decode(bin, decoderOpts);

  let uint8Buffer = new Uint8Array(bin);

  uint8Buffer = removeSection(ast, uint8Buffer, "custom");

  return uint8Buffer.buffer;
}
