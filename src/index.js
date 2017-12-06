// @flow

const {parseSource} = require('./compiler/parsing/watf');
const {evaluateAst} = require('./interpreter');
const {initializeMemory} = require('./interpreter/kernel/memory');

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

export function parse(content: string, cb: (ast: Node) => void) {
  const ast = parseSource(content);

  cb(ast);
}

const WebAssembly = {

  instantiate(content: string/*, importObject: Object */): ModuleInstance {
    const ast = parseSource(content);
    const result = evaluateAst(ast);

    return result;
  }

};

export default WebAssembly;
