#!/usr/bin/env node

const { decode } = require("@webassemblyjs/wasm-parser");
const { readFileSync } = require("fs");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const decoderOpts = {
  dump: true
};

if (process.argv.indexOf("--ignore-code-section") !== -1) {
  decoderOpts.ignoreCodeSection = true;
}

// $FlowIgnore: this is correct but not correctly documented
const buff = toArrayBuffer(readFileSync(filename, null));

decode(buff, decoderOpts);
