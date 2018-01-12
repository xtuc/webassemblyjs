// @flow

const { parse } = require("./grammar");
const { tokenize } = require("./tokenizer");
const wastIdentifierToIndex = require("../../transform/wast-identifier-to-index");
const wastInstructionToCall = require("../../transform/wast-instruction-to-call");

export function parseSource(source: string): Program {
  const tokens = tokenize(source);

  // We pass the source here to show code frames
  const ast = parse(tokens, source);

  wastInstructionToCall.transform(ast);
  wastIdentifierToIndex.transform(ast);

  return ast;
}
