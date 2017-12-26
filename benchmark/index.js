const {readFileSync} = require('fs');
const glob = require('glob');
const path = require('path');
const vm = require('vm');
const now = require('performance-now');

if (typeof WebAssembly === 'undefined') {
  console.log('WebAssembly not supported, skiping.');
  process.exit(0);
}

const interpreter = require('../lib');

const benchmarks = glob.sync('benchmark/**/module.wasm');

function toArrayBuffer(buf) {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
}

function createShowHeader(mode) {
  return function() {
    console.log('Testing', mode);
  };
}

benchmarks.forEach((file) => {
  const module = toArrayBuffer(readFileSync(file, null));

  const execFile = path.join(path.dirname(file), 'bench.tjs');
  const exec = readFileSync(execFile, 'utf8');

  const NBINTERATION = 10000;

  const sandbox = {
    wasmmodule: module,
    console: global.console,
    now,
    NBINTERATION,
  };

  // Run native
  const nativeSandbox = Object.assign({}, sandbox, {
    WebAssembly: global.WebAssembly,
    showHeader: createShowHeader('native'),
  });

  vm.runInNewContext(exec, nativeSandbox, {filename: file});

  // Run interpreted
  const interpretedSandbox = Object.assign({}, sandbox, {
    showHeader: createShowHeader('interpreted'),
    WebAssembly: interpreter,
  });

  vm.runInNewContext(exec, interpretedSandbox, {filename: file});
});
