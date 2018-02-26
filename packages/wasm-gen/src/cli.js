#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const {readFileSync} = require('fs');

const print = require('./index');

function out(msg) {
  process.stdout.write(msg + '\n');
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

program
  .version(pkg.version)
  .usage('[options] <file>')
  .option('-o, --out [type]', 'Output format', 'text')
  .option('--url [url]', 'URL of the WASM binary')
  .parse(process.argv);

const [filename] = program.args;
const buff = toArrayBuffer(readFileSync(filename, null));

out(print(buff, program));
