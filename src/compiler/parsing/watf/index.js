// @flow

const {parse} = require('./grammar');
const {tokenize} = require('./tokenizer');

function parseSource(source: string): Node {
  const tokens = tokenize(source);
  const ast = parse(tokens);

  return ast;
}

module.exports = {parseSource};
