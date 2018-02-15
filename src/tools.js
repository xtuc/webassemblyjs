// @flow

const { parseSource } = require("./compiler/parsing/watf");
const { parseBinary } = require("./compiler/parsing/wasm");
const { traverse } = require("./compiler/AST/traverse");
const t = require("./compiler/AST/index");
const { printWAST } = require("./compiler/printer/wast");

export const printers = {
  printWAST
};

export const parsers = {
  parseWATF(content: string): Program {
    return parseSource(content);
  },

  parseWATFSpecTest(content: string): Program {
    return parseSource(content);
  },

  parseWASM(content: ArrayBuffer): Program {
    return parseBinary(content);
  }
};

export { traverse, t };
