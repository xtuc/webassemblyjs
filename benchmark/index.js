const {readFileSync} = require('fs');
const glob = require('glob');
const path = require('path');
const vm = require('vm');
const {performance} = require('perf_hooks');

if (typeof WebAssembly === 'undefined') {
  throw new Error('WebAssembly not supported');
}

const interpreter = require('../lib');

const benchmarks = glob.sync('benchmark/**/module.wasm');

function toArrayBuffer(buf) {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
}

benchmarks.forEach((file) => {
  const module = toArrayBuffer(readFileSync(file, null));

  const execFile = path.join(path.dirname(file), 'bench.tjs');
  const exec = readFileSync(execFile, 'utf8');

  const NBINTERATION = 10000;

  console.log('native', file);

  // Run native
  let sandbox = {
    WebAssembly: global.WebAssembly,
    wasmmodule: module,
    console: global.console,
    performance,
    NBINTERATION,
  };

  vm.runInNewContext(exec, sandbox, {filename: file});

  console.log('interpreted', file);

  // Run interpreted
  sandbox = {
    WebAssembly: interpreter,
    wasmmodule: module,
    console: global.console,
    performance,
    NBINTERATION,
  };

  vm.runInNewContext(exec, sandbox, {filename: file});
});
