// @flow

const { parse } = require("./grammar");
const { tokenize } = require("./tokenizer");
const wastIdentifierToIndex = require("../../transform/wast-identifier-to-index");

export function parseSource(source: string): Program {
  const tokens = tokenize(source);

  // We pass the source here to show code frames
  const ast = parse(tokens, source);

  wastIdentifierToIndex.transform(ast);

  return ast;
}
