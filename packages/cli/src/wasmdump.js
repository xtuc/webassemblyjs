#!/usr/bin/env node
// @flow

const { decode } = require("../compiler/parsing/wasm/decoder");
const { readFileSync } = require("fs");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

// $FlowIgnore: this is correct but not correctly documented
const buff = toArrayBuffer(readFileSync(filename, null));

decode(buff, true);
