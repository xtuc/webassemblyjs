// @flow

const glob = require('glob');
const chai = require('chai');
const {readFileSync} = require('fs');
const path = require('path');
const vm = require('vm');

const WebAssembly = require('../../lib');

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

describe('interpreter', () => {

  describe('watf', () => {
    const testSuites = glob.sync('test/interpreter/fixtures/**/module.wast');

    testSuites.forEach((suite) => {

      describe(suite, () => {
        const execFile = path.join(path.dirname(suite), 'exec.tjs');

        const module = readFileSync(suite, 'utf8');
        const exec = readFileSync(execFile, 'utf8');

        const sandbox = {
          WebAssembly,
          watfmodule: module,
          console: global.console,
          assert: chai.assert,
          it,
        };

        vm.runInNewContext(exec, sandbox);
      });
    });

  });

  describe('wasm', () => {
    const testSuites = glob.sync('test/interpreter/fixtures/**/module.wasm');

    testSuites.forEach((suite) => {

      describe(suite, () => {
        const execFile = path.join(path.dirname(suite), 'exec.tjs');

        const module = toArrayBuffer(new Buffer(readFileSync(suite, 'binary')));
        const exec = readFileSync(execFile, 'utf8');

        const sandbox = {
          WebAssembly,
          wasmmodule: module,
          console: global.console,
          assert: chai.assert,
          it,
        };

        vm.runInNewContext(exec, sandbox);
      });
    });

  });

});
