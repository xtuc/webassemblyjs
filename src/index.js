// @flow

const { parseSource } = require("./compiler/parsing/watf");
const { parseBinary } = require("./compiler/parsing/wasm");
const { Instance } = require("./interpreter");
const { RuntimeError, CompileError, LinkError } = require("./errors");
const { createCompiledModule, Module } = require("./compiler/compile/module");
const { Memory } = require("./interpreter/runtime/values/memory");
const { Table } = require("./interpreter/runtime/values/table");
const { checkEndianness } = require("./check-endianness");

const WebAssembly = {
  instantiate(
    buff: ArrayBuffer,
    importObject: ImportObject = {}
  ): Promise<InstansitatedInstanceAndModule> {
    return new Promise((resolve, reject) => {
      if (checkEndianness() === false) {
        return reject(
          new RuntimeError("expected the system to be little-endian")
        );
      }

      if (
        buff instanceof ArrayBuffer === false &&
        buff instanceof Uint8Array === false
      ) {
        return reject(
          "Module must be either an ArrayBuffer or an Uint8Array (BufferSource), " +
            typeof buff +
            " given."
        );
      }

      const ast = parseBinary(buff);
      const module = createCompiledModule(ast);

      resolve({
        instance: new Instance(module, importObject),
        module
      });
    });
  },

  compile(buff: ArrayBuffer): Promise<CompiledModule> {
    return new Promise(resolve => {
      const ast = parseBinary(buff);

      resolve(createCompiledModule(ast));
    });
  },

  instantiateFromSource(
    content: string,
    importObject: ImportObject = {}
  ): Instance {
    const ast = parseSource(content);
    const module = createCompiledModule(ast);

    return new Instance(module, importObject);
  },

  Instance,
  Module,
  Memory,
  Table,
  RuntimeError,
  LinkError,
  CompileError
};

module.exports = WebAssembly;
