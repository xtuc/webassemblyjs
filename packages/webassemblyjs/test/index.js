// @flow

const glob = require("glob");
const chai = require("chai");
const { readFileSync } = require("fs");
const path = require("path");
const vm = require("vm");
const { parse } = require('../../wast-parser/lib/')
const assert = require('assert')

const WebAssembly = require("../lib");
const validate = require('../lib/compiler/validation/stack').default

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("interpreter", () => {

  describe("validation", () => {
    const testSuites = glob.sync(
      "packages/webassemblyjs/test/validation/**/module.wast"
    );

    testSuites.forEach(suite => {
      describe(suite, () => {
        const module = readFileSync(suite, 'utf8');
        const expectedErrors = readFileSync(path.join(path.dirname(suite), 'throws.txt'), 'utf8')
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0)
        
        it('should give correct list of type errors', () => {
          const ast = parse(module)
          const errors = validate(ast)

          assert.deepEqual(errors, expectedErrors);
        })

      })
    })
  })

  describe("wasm", () => {
    const testSuites = glob.sync(
      "packages/webassemblyjs/test/fixtures/**/module.wasm"
    );

    testSuites.forEach(suite => {
      describe(suite, () => {
        const execFile = path.join(path.dirname(suite), "exec.tjs");

        const module = toArrayBuffer(readFileSync(suite, null));
        const exec = readFileSync(execFile, "utf8");

        const sandbox = {
          WebAssembly,
          wasmmodule: module,
          console: global.console,
          assert: chai.assert,
          it,
          xit
        };

        try {
          vm.runInNewContext(exec, sandbox, { filename: suite });
        } catch (e) {
          it("should run script", () => {
            throw e;
          });
        }
      });
    });
  });

  describe("wat", () => {
    const testSuites = glob.sync(
      "packages/webassemblyjs/test/fixtures/**/module.wast"
    );

    testSuites.forEach(suite => {
      describe(suite, () => {
        const execFile = path.join(path.dirname(suite), "exec.tjs");

        const module = readFileSync(suite, "utf8");
        const exec = readFileSync(execFile, "utf8");

        const sandbox = {
          WebAssembly,
          watmodule: module,
          require: require,
          console: global.console,
          assert: chai.assert,
          it,
          xit
        };

        try {
          vm.runInNewContext(exec, sandbox, { filename: suite });
        } catch (e) {
          it("should run script", () => {
            throw e;
          });
        }
      });
    });
  });
});
