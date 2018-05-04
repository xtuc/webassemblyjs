// @flow

import { decode } from "@webassemblyjs/wasm-parser";

class OptimizerError extends Error {
  constructor(name, initalError) {
    super("Error while optimizing: " + name + ": " + initalError.message);

    this.stack = initalError.stack;
  }
}

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true
};

import { shrinkPaddedLEB128 as makeShrinkPaddedLEB128 } from "./leb128.js";

export function shrinkPaddedLEB128(uint8Buffer: Uint8Array): Uint8Array {
  try {
    const ast = decode(uint8Buffer.buffer, decoderOpts);
    return makeShrinkPaddedLEB128(ast, uint8Buffer);
  } catch (e) {
    throw new OptimizerError("shrinkPaddedLEB128", e);
  }
}
