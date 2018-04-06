// @flow

import * as parser from "./grammar";
const { tokenize } = require("./tokenizer");

export function parse(source: string): Program {
  const tokens = tokenize(source);

  // We pass the source here to show code frames
  const ast = parser.parse(tokens, source);

  return ast;
}
