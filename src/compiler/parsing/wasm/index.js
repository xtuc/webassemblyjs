// @flow

const { decode } = require("./decoder");

export function parseBinary(buf: ArrayBuffer): Program {
  const ast = decode(buf);
  return ast;
}
