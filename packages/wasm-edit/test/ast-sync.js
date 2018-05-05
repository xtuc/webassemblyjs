const t = require("@webassemblyjs/ast");
const { decode } = require("@webassemblyjs/wasm-parser");
const {
  encodeVersion,
  encodeHeader
} = require("@webassemblyjs/wasm-gen/lib/encoder");
const { makeBuffer } = require("@webassemblyjs/helper-buffer");
const { compareStrings } = require("@webassemblyjs/helper-test-framework");
const constants = require("@webassemblyjs/helper-wasm-bytecode");

const { addWithAST, editWithAST } = require("../lib");

const getUniqueName = t.getUniqueNameGenerator();

function ASTToString(ast) {
  const astCopy = JSON.parse(JSON.stringify(ast));

  t.traverse(astCopy, {
    NumberLiteral({ node }) {
      delete node.raw;
    },

    // we compare only module's metadata for now
    Module({ node }) {
      delete node.fields;
    }
  });

  return JSON.stringify(astCopy, null, 2);
}

function makeGlobalNode(n) {
  return t.global(t.globalType("i32", "const"), [
    t.objectInstruction("const", "i32", [t.numberLiteral(n)])
  ]);
}

function removeNodesOfType(t) {
  return {
    [t](path) {
      path.remove();
    }
  };
}

function makeFuncNodes(i, params = [], results = [], body = []) {
  const id = t.identifier(getUniqueName());
  const func = t.func(id, params, results, body);

  const functype = t.typeInstructionFunc(params, results);

  const funcindex = t.indexInFuncSection(i);

  return [func, functype, funcindex];
}

function makeFuncExportNode(i) {
  const name = getUniqueName();

  return t.moduleExport(name, "Func", i);
}

describe("AST synchronization", () => {
  // (module)
  const bin = makeBuffer(
    encodeHeader(),
    encodeVersion(1),
    [constants.sections.type, 0x04, 0x01],
    /* 1 */ [0x60, 0x00, 0x00]
  );

  const ast = decode(bin);

  const steps = [
    b => addWithAST(ast, b, []),
    b => editWithAST(ast, b, {}),
    b => addWithAST(ast, b, [makeGlobalNode(1)]),
    b => editWithAST(ast, b, removeNodesOfType("TypeInstruction")),
    b => addWithAST(ast, b, [makeGlobalNode(2)]),
    b => addWithAST(ast, b, makeFuncNodes(0)),
    b => addWithAST(ast, b, [makeFuncExportNode(0)])
  ];

  it("should run steps", function() {
    if (typeof WebAssembly === "undefined") {
      console.log("WebAssembly not available, skipping");
      this.skip();
      return;
    }

    steps.reduce((acc, step) => {
      const stepBin = step(acc);

      const actualAst = ASTToString(ast);
      const expectedAst = ASTToString(decode(stepBin));

      try {
        compareStrings(actualAst, expectedAst);
      } catch (e) {
        console.error("failed at step", step.toString());
        throw e;
      }

      WebAssembly.Module(stepBin);

      return stepBin;
    }, bin);
  });
});
