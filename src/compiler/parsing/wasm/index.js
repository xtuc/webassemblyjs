// @flow

const {decode} = require('./decoder');

export function parseBinary(buf: ArrayBuffer): Node {
  const ast = decode(buf);

  return ast;
}
