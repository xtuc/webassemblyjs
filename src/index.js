// @flow

const {readFileSync} = require('fs');
const {parseSource} = require('./compiler/parsing/watf');

function getFileContent(filename: string): string {
  return readFileSync(filename, 'utf8');
}

export default function (filename: string, cb: (string) => void) {
  console.log(filename, cb);
}

export function parse(filename: string, cb: (string) => void) {
  const content = getFileContent(filename);
  const ast = parseSource(content);

  cb(JSON.stringify(ast, null, 2));
}
