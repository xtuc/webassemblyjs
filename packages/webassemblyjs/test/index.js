// @flow

const glob = require("glob");
const chai = require("chai");
const { readFileSync } = require("fs");
const path = require("path");
const vm = require("vm");

const {
  getFixtures,
  compare
} = require("@webassemblyjs/helper-test-framework");

const WebAssembly = require("../lib");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const getActual = (module, suite) => {
  const execFile = path.join(path.dirname(suite), "exec.tjs");

  const exec = readFileSync(execFile, "utf8");

  const sandbox = {
    WebAssembly,
    wasmmodule: module,
    watmodule: module,
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

  return "";
};

describe("interpreter", () => {
  describe("wasm", () => {
    const testSuites = getFixtures(__dirname, "fixtures", "**/module.wasm");

    compare(testSuites, getActual);
  });

  describe("wat", () => {
    const testSuites = getFixtures(__dirname, "fixtures", "**/module.wast");

    compare(testSuites, getActual);
  });
});
