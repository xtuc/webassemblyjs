// @flow

const glob = require("glob");
const chai = require("chai");
const { readFileSync } = require("fs");
const path = require("path");
const vm = require("vm");

const WebAssembly = require("../lib");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("interpreter", () => {
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
