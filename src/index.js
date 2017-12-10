// @flow

const {parseSource} = require('./compiler/parsing/watf');
const {parseBinary} = require('./compiler/parsing/wasm');
const {evaluateAst} = require('./interpreter');
const {initializeMemory} = require('./interpreter/kernel/memory');
const {RuntimeError} = require('./interpreter/errors');

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

const WebAssembly = {

  instantiate(buff: ArrayBuffer/*, importObject: Object */): UserlandModuleInstance {

    if (
      buff instanceof ArrayBuffer === false
      && buff instanceof Uint8Array === false
    ) {
      throw new Error(
        'Module must be either an ArrayBuffer or an Uint8Array (BufferSource), '
          + (typeof buff) + ' given'
      );
    }

    const ast = parseBinary(buff);
    return evaluateAst(ast);
  },

  instantiateFromSource(content: string): UserlandModuleInstance {
    const ast = parseSource(content);
    return evaluateAst(ast);
  },

  RuntimeError,
};

const _debug = {

  parseWATF(content: string, cb: (ast: Node) => void) {
    const ast = parseSource(content);

    cb(ast);
  },

  parseWASM(content: ArrayBuffer, cb: (ast: Node) => void) {
    const ast = parseBinary(content);

    cb(ast);
  },

};

module.exports = WebAssembly;
module.exports._debug = _debug;
