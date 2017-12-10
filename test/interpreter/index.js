// @flow

const glob = require('glob');
const chai = require('chai');
const diff = require('jest-diff');
const {readFileSync} = require('fs');
const path = require('path');
const vm = require('vm');

const WebAssembly = require('../../lib');

describe('interpreter', () => {

  describe('watf', () => {
    const testSuites = glob.sync('test/interpreter/fixtures/**/module.wast');

    testSuites.forEach((suite) => {

      it(suite, () => new Promise((resolve) => {
        const execFile = path.join(path.dirname(suite), 'exec.tjs');

        const module = readFileSync(suite, 'utf8');
        const exec = readFileSync(execFile, 'utf8');

        const sandbox = {
          WebAssembly,
          watfmodule: module,
          console: global.console,
          assert: chai.assert,
          ok: resolve,
        };

        vm.runInNewContext(exec, sandbox);
      }));
    });

  });

  describe('wasm', () => {
    const testSuites = glob.sync('test/interpreter/fixtures/**/module.wasm');

    testSuites.forEach((suite) => {

      it(suite, () => new Promise((resolve) => {
        const execFile = path.join(path.dirname(suite), 'exec.tjs');

        const module = new Buffer(readFileSync(suite, 'binary'));
        const exec = readFileSync(execFile, 'utf8');

        const sandbox = {
          WebAssembly,
          wasmmodule: module,
          console: global.console,
          assert: chai.assert,
          ok: resolve,
        };

        vm.runInNewContext(exec, sandbox);
      }));
    });

  });

});
