#!/usr/bin/env node
// @flow

const { parse } = require("@webassemblyjs/wast-parser");
const { readFileSync } = require("fs");

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const content = readFileSync(filename, "utf8");
const ast = parse(content);

console.log(JSON.stringify(ast, null, 2));
