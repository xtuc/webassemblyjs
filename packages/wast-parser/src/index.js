// @flow

import * as parser from "./grammar";
const { tokenize } = require("./tokenizer");

type Args = {
  onParseError?: OnParserErrorDebugHook
};

export function parse(source: string, { onParseError }: Args): Program {
  const tokens = tokenize(source, { onParseError });

  // We pass the source here to show code frames
  const ast = parser.parse(tokens, source, { onParseError });

  return ast;
}
