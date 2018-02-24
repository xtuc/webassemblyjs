// @flow

const { parseSource } = require("./compiler/parsing/wast");
const { parseBinary } = require("./compiler/parsing/wasm");
const { traverse } = require("./compiler/AST/traverse");
const t = require("./compiler/AST/index");
const { printWAST } = require("./compiler/printer/wast");

export const printers = {
  printWAST
};

export const parsers = {
  parseWAT(content: string): Program {
    return parseSource(content);
  },

  parseWAST(content: string): Program {
    return parseSource(content);
  },

  parseWASM(content: ArrayBuffer): Program {
    return parseBinary(content);
  }
};

export { traverse, t };
