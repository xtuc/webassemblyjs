const {readFileSync, writeFileSync} = require('fs');
const glob = require('glob');
const path = require('path');
const vm = require('vm');
const now = require('performance-now');

const interpreter = require('../lib');

if (typeof WebAssembly === 'undefined') {
  console.log('WebAssembly not supported, skiping.');
  process.exit(0);
}

const benchmarks = glob.sync('benchmark/**/module.wasm');

function toArrayBuffer(buf) {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
}

function formatNumber(i) {
  let unit = 'ms';

  if (i < 1) {
    i *= Math.pow(10, 6);
    unit = 'ns';
  }

  return `${i.toFixed(10)} ${unit}`;
}

function writeResult(dir, result) {
  const resultFile = path.join(dir, 'results');
  writeFileSync(resultFile, result);

  console.log('wrote result file', resultFile);
}

benchmarks.forEach((file) => {
  let outputBuffer = '';
  let nbOk = 0;

  function createShowHeader(mode) {
    return function() {
      output('');
      output('Testing ' + mode);
    };
  }

  function output(msg) {
    outputBuffer += msg + '\n';
    process.stdout.write(msg + '\n');
  }

  function clearOuputBuffer() {
    outputBuffer = '';
  }

  function ok() {
    nbOk++;

    if (nbOk === 2) {
      // Write results
      writeResult(path.dirname(file), outputBuffer);

      clearOuputBuffer();
    }
  }

  const module = toArrayBuffer(readFileSync(file, null));

  const execFile = path.join(path.dirname(file), 'bench.tjs');
  const exec = readFileSync(execFile, 'utf8');

  const NBINTERATION = Math.pow(10, 6);

  const sandbox = {
    wasmmodule: module,
    output,
    now,
    NBINTERATION,
    formatNumber,
    ok,
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
