// @flow

const {parseSource} = require('./compiler/parsing/watf');
const {parseBinary} = require('./compiler/parsing/wasm');
const {evaluateAst} = require('./interpreter');
const {initializeMemory} = require('./interpreter/kernel/memory');

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

const WebAssembly = {

  instantiate(buff: Buffer/*, importObject: Object */): UserlandModuleInstance {
    const ast = parseBinary(buff);
    return evaluateAst(ast);
  },

  instantiateFromSource(content: string): UserlandModuleInstance {
    const ast = parseSource(content);
    return evaluateAst(ast);
  },

};

const _debug = {

  parseWATF(content: string, cb: (ast: Node) => void) {
    const ast = parseSource(content);

    cb(ast);
  },

  parseWASM(content: Buffer, cb: (ast: Node) => void) {
    const ast = parseBinary(content);

    cb(ast);
  },

};

module.exports = WebAssembly;
module.exports._debug = _debug;
