#!/usr/bin/env node

const readline = require("readline");
const { createReadStream, readFileSync, existsSync } = require("fs");

const { createRepl } = require("./index");

const filename = process.argv[2];
const isVerbose = process.argv.find(x => x === "--debug") !== undefined;

function onAssert() {
  process.exit(1);
}

function onLog(txt) {
  console.log(txt);
}

function onOk() {}

let failingList;

if (existsSync("./testsuite-failing.txt") === true) {
  failingList = readFileSync("./testsuite-failing.txt", "utf8").split("\n");
}

const repl = createRepl({
  filename,
  isVerbose,
  onAssert,
  onOk,
  onLog,
  failingList
});

if (filename === undefined) {
  const rl = readline.createInterface({
    input: process.stdin
  });

  process.stdout.write("wasm 1.0 JavaScript interpreter\n");
  process.stdout.write("> ");

  rl.on("line", repl.read);
} else {
  const rl = readline.createInterface({
    input: createReadStream(filename)
  });

  rl.on("line", repl.read);
}
