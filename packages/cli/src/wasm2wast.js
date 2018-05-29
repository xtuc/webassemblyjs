#!/usr/bin/env node
const { readFileSync } = require("fs");
const { decode } = require("@webassemblyjs/wasm-parser");
const { print } = require("@webassemblyjs/wast-printer");

const decoderOpts = {};

// configure name resolution
if (process.argv.indexOf("--no-name-resolution") !== -1) {
  decoderOpts.ignoreCustomNameSection = true;
}

if (process.argv.indexOf("--ignore-code-section") !== -1) {
  decoderOpts.ignoreCodeSection = true;
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

const buff = toArrayBuffer(readFileSync(filename, null));
const ast = decode(buff, decoderOpts);

const wast = print(ast);

process.stdout.write(wast);
