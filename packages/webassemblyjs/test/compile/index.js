// @flow

const glob = require("glob");
const vm = require("vm");
const { readFileSync } = require("fs");
const path = require("path");
const chai = require("chai");

const WebAssembly = require("../../lib");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("compiler", () => {
  describe("compile", () => {
    const testSuites = glob.sync(
      "test/compiler/compile/fixtures/**/module.wasm"
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
});
