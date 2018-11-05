// @flow

const { assert } = require("chai");
const {
  getFixtures,
  compare
} = require("@webassemblyjs/helper-test-framework");

const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const constants = require("@webassemblyjs/helper-wasm-bytecode").default;
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

      // TODO(sven): needs refactor for https://github.com/xtuc/webassemblyjs/issues/405
      delete node.numeric;
    },

    BlockComment(path) {
      path.remove();
    },

    Instr(path) {
      if (path.node.id === "end") {
        path.remove();
      }
    }
  });

  return ast;
}

// - Expected is wast-parser
// + Received is wasm-parser
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

  describe("section ordering", () => {
    it("should throw when the section are in the wrong order", () => {
      const buffer = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.code, 0x01, 0x00],
        [constants.sections.func, 0x01, 0x00]
      );

      const fn = () => decode(buffer);

      assert.throws(fn, "Unexpected section: 0x3");
    });
  });

  describe("ignore section(s)", () => {
    const decoderOpts = {
      ignoreDataSection: true
    };

    it("should eat the data section without overflowing", () => {
      const buffer = makeBuffer(
        encodeHeader(),
        encodeVersion(1),
        [constants.sections.data, 0x05, 0x01, 0x01, 0x41, 0x01, 0x00],
        [constants.sections.custom, 0x04, 0x01, 0x01, 97, 0x00, 0x00]
      );

      const ast = decode(buffer, decoderOpts);

      let foundCustomSection = false;

      traverse(ast, {
        SectionMetadata({ node }) {
          if (node.section === "custom") {
            foundCustomSection = true;
          }
        }
      });

      assert.isTrue(foundCustomSection, "Custom section was not detected");
    });
  });
});
