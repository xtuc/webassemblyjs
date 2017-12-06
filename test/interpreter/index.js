// @flow

const glob = require('glob');
const chai = require('chai');
const diff = require('jest-diff');
const {readFileSync} = require('fs');
const path = require('path');
const vm = require('vm');

const WebAssembly = require('../../lib');

const testSuites = glob.sync('test/interpreter/fixtures/**/module.watf');

describe('interpreter', () => {

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
