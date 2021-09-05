#!/usr/bin/env node

const { decode } = require("@webassemblyjs/wasm-parser");
const { traverse } = require("@webassemblyjs/ast");
const { readFileSync } = require("fs");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true,
};

// $FlowIgnore: this is correct but not correctly documented
const buff = toArrayBuffer(readFileSync(filename, null));
const ast = decode(buff, decoderOpts);

let found = false;

traverse(ast, {
  ProducersSectionMetadata({ node }) {
    node.producers.forEach((entry) => {
      entry.forEach((producer) => {
        console.log(producer.name, producer.version);
      });
    });

    found = true;
  },
});

if (found === false) {
  console.error("no producer section found");
}
