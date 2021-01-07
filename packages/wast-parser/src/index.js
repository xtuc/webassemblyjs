// @flow

import * as parser from "./grammar";
import { tokenize } from "./tokenizer";

export function parse(source: string): Program {
  const tokens = tokenize(source);

  // We pass the source here to show code frames
  const ast = parser.parse(tokens, source);

  return ast;
}

export * from "@webassemblyjs/helper-numbers";
