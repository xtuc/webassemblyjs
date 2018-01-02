// @flow

const {parse} = require('./grammar');
const {tokenize} = require('./tokenizer');

function parseSource(source: string): Program {
  const tokens = tokenize(source);

  // We pass the source here to show code frames
  const ast = parse(tokens, source);

  return ast;
}

module.exports = {parseSource};
