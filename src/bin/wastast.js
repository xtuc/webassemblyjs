#!/usr/bin/env node
// @flow

const { parseSource } = require("../compiler/parsing/watf");
const { readFileSync } = require("fs");

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const content = readFileSync(filename, "utf8");
const ast = parseSource(content);

console.log(JSON.stringify(ast, null, 2));
