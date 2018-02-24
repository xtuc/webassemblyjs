#!/usr/bin/env node
const { readFileSync } = require("fs");

const { parsers, printers } = require("../tools");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

const buff = toArrayBuffer(readFileSync(filename, null));
const ast = parsers.parseWASM(buff);

const wast = printers.printWAST(ast);

process.stdout.write(wast);
