// @flow

const {parse} = require('./grammar');
const {tokenize} = require('./tokenizer');

export function parseBinary(buf: Buffer): Node {
  const tokens = tokenize(buf);
  const ast = parse(tokens);

  return ast;
}
