#!/usr/bin/env node
// @flow

const wastIdentifierToIndex = require("@webassemblyjs/ast/lib/transform/wast-identifier-to-index");
const denormalizeTypeReferences = require("@webassemblyjs/ast/lib/transform/denormalize-type-references");
const { parse } = require("@webassemblyjs/wast-parser");
const { print } = require("@webassemblyjs/wast-printer");
const { readFileSync } = require("fs");

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const content = readFileSync(filename, "utf8");
const ast = parse(content);

denormalizeTypeReferences.transform(ast);
wastIdentifierToIndex.transform(ast);

console.log(print(ast));
