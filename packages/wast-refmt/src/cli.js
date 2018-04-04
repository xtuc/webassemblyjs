#!/usr/bin/env node

const { readFileSync } = require("fs");
const refmt = require("./").default;

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const content = readFileSync(filename, "utf8");
const newContent = refmt(content);

console.log(newContent);
