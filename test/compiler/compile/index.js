// @flow

const glob = require('glob');
const vm = require('vm');
const {readFileSync} = require('fs');
const path = require('path');
const chai = require('chai');

const WebAssembly = require('../../../lib');

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

describe('compiler', () => {

  describe('compile', () => {
    const testSuites = glob.sync('test/compiler/compile/fixtures/**/module.wasm');

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

