// @flow

const {
  getFixtures,
  compare
} = require("@webassemblyjs/helper-test-framework");

const wabt = require("wabt");
const { parse } = require("@webassemblyjs/wast-parser");
const { decode } = require("../lib");
const { traverse } = require("@webassemblyjs/ast");

// remove the additional metadata from the wasm parser
function stripMetadata(ast) {
  traverse(ast, {
    // currently the WAT parser does not support function type definitions
    TypeInstruction(path) {
      path.remove();
    },

    Node({ node }) {
      delete node.raw;
      delete node.metadata;
      delete node.loc;
    }
  });

  return ast;
}

// - Expected is wasm-parser
// + Received is wast-parser
describe("Binary decoder", () => {
  const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wat");

  // convert the WAT fixture to WASM
  const getActual = (f, suite) => {
    const module = wabt.parseWat(suite, f);
    const { buffer } = module.toBinary({ write_debug_names: true });

    // read the WASM file and strip custom metadata
    const ast = stripMetadata(decode(buffer));
    const actual = JSON.stringify(ast, null, 2);

    return actual;
  };

  // parse the wat file to create the expected AST
  const getExpected = f => {
    const ast = stripMetadata(parse(f));
    const expected = JSON.stringify(ast, null, 2);

    return expected;
  };

  compare(testSuites, getActual, getExpected);
});
