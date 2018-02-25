// @flow

const { decode } = require("./decoder");

type Opts = {
  dump: boolean
};

export function parseBinary(buf: ArrayBuffer, { dump }: Opts = {}): Program {
  const ast = decode(buf, dump);
  return ast;
}
