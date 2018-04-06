#!/usr/bin/env node

const { readFileSync, writeFileSync } = require("fs");
const refmt = require("./").default;

const filename = process.argv[2];
const isInplaceFix = process.argv.indexOf("--fix") !== -1;

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const content = readFileSync(filename, "utf8");
const newContent = refmt(content);

if (isInplaceFix === true) {
  writeFileSync(filename, newContent);
} else {
  process.stdout.write(newContent);
}
