// @flow

const glob = require("glob");
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { writeFileSync, readFileSync } = require("fs");
const path = require("path");
const wabt = require("wabt");
const { parse } = require("@webassemblyjs/wast-parser");
const { decode } = require("../lib");
const { traverse } = require("@webassemblyjs/ast");

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function jsonTraverse(o, func) {
  func(o);
  for (const i in o) {
    if (o[i] !== null && typeof o[i] == "object") {
      jsonTraverse(o[i], func);
    }
  }
}

function stripMetadata(ast) {
  jsonTraverse(ast, node => {
    // remove the additional metadata from the wasm parser
    delete node.metadata;
    delete node.loc;
    // raw values are WAST specific
    delete node.raw;
  });
  traverse(ast, {
    // currently the WAT parser does not support function type definitions
    TypeInstruction(path) {
      path.remove();
    }
  });
  return ast;
}

function createCheck(actualWatPath) {
  // convert the wat fixture to wasm
  const actualWat = readFileSync(actualWatPath, "utf8");
  const module = wabt.parseWat(actualWatPath, actualWat);
  const { buffer } = module.toBinary({ write_debug_names: true });
  const actualWasmPath = path.join(path.dirname(actualWatPath), "actual.wasm");
  writeFileSync(actualWasmPath, new Buffer(buffer));

  // read the wasm file and strip custom metadata
  const bin = toArrayBuffer(readFileSync(actualWasmPath));
  const ast = stripMetadata(decode(bin));
  const actual = JSON.stringify(ast, null, 2);

  // parse the wat file to create the expected AST
  const astFromWat = stripMetadata(parse(actualWat));
  const expected = JSON.stringify(astFromWat, null, 2);

  const out = diff(expected.trim(), actual.trim());

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }

  // When one line the error is not caught
  if (actual.trim() !== expected.trim()) {
    throw new Error("Assertion error");
  }
}

describe("compiler", () => {
  describe("Binary format parsing", () => {
    const testSuites = glob.sync(
      "packages/wasm-parser/test/fixtures/func/with-shorthand-export/actual.wat"
    );

    testSuites.forEach(suite => {
      it(suite, () => {
        createCheck(suite);
      });
    });
  });
});
