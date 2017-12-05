// @flow

const {readFileSync} = require('fs');
const {parseSource} = require('./compiler/parsing/watf');
const {evaluateAst} = require('./interpreter');
const {initializeMemory} = require('./interpreter/kernel/memory');

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

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



export const WebAssembly = {

  instantiate(content: string/*, importObject: Object */): ModuleInstance {

    const ast = parseSource(content);
    const result = evaluateAst(ast);

    return result;
  }

};
