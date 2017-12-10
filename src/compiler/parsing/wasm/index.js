// @flow

const {decode} = require('./decoder');

export function parseBinary(buf: Buffer): Node {
  const ast = decode(buf);

  return ast;
}
