#!/usr/bin/env node

const { readFileSync, writeFileSync } = require("fs");

const strip = require("./").default;

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const bin = readFileSync(filename, null);

const newBin = strip(bin);

writeFileSync(filename, new Buffer(newBin));
