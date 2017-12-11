// @flow

const {parseSource} = require('./compiler/parsing/watf');
const {parseBinary} = require('./compiler/parsing/wasm');
const {Instance} = require('./interpreter');
const {initializeMemory} = require('./interpreter/kernel/memory');
const {RuntimeError, CompileError, LinkError} = require('./errors');
const {createCompiledModule, Module} = require('./compiler/compile/module');
const {Memory} = require('./interpreter/kernel/memory');

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

const WebAssembly = {

  instantiate(buff: ArrayBuffer, importObject?: Object): Promise<Instance> {

    return new Promise((resolve, reject) => {

      if (
        buff instanceof ArrayBuffer === false
        && buff instanceof Uint8Array === false
      ) {
        return reject(
          'Module must be either an ArrayBuffer or an Uint8Array (BufferSource), '
            + (typeof buff) + ' given.'
        );
      }

      const ast = parseBinary(buff);
      const module = createCompiledModule(ast);

      resolve(
        new Instance(module)
      );

    });
  },

  compile(buff: ArrayBuffer): Promise<CompiledModule> {

    return new Promise((resolve) => {
      const ast = parseBinary(buff);

      resolve(
        createCompiledModule(ast)
      );
    });
  },

  instantiateFromSource(content: string): Instance {
    const ast = parseSource(content);
    const module = createCompiledModule(ast);

    return new Instance(module, {});
  },

  Instance,
  Module,
  Memory,
  RuntimeError,
  LinkError,
  CompileError,
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
