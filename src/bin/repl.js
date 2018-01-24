#!/usr/bin/env node

const readline = require("readline");
const { createReadStream } = require("fs");

const { _debug } = require("../index");
const { createCompiledModule } = require("../compiler/compile/module");
const { Instance } = require("../interpreter");
const partialEvaluation = require("../interpreter/partial-evaluation");
const { Memory } = require("../interpreter/runtime/values/memory");
const { createAllocator } = require("../interpreter/kernel/memory");

const isVerbose = process.argv.find(x => x === "--debug") !== undefined;

/**
 * Assert helpers
 */

// assert module is invalid with given failure string
// ( assert_invalid <module> <failure> )
function assert_invalid(node) {
  const [module, expected] = node.args;

  try {
    createInstanceFromAst(module);

    assert(false, "module is valid, expected invalid");
  } catch (err) {
    assert(err.message === expected);
  }
}

// assert action has expected results
// ( assert_return <action> <expr>* )

// action:
//   ( invoke <name>? <string> <expr>* )        ;; invoke function export
//   ( get <name>? <string> )                   ;; get global export

function assert_return(node) {
  const [action, ...exprs] = node.args;

  if (action.type === "Instr" && action.id === "invoke") {
    const actualRes = invoke(action);
    let expectedRes;

    const expectedEvaluation = partialEvaluation.evaluate(allocator, exprs);

    if (expectedEvaluation !== undefined) {
      expectedRes = expectedEvaluation.value.toString();
    }

    assert(
      actualRes === expectedRes,
      `expected ${expectedRes}, ${actualRes} given`
    );
  } else {
    throw new Error("Unsupported action in assert_return: " + action.id);
  }
}

// invoke function export
// ( invoke <name>? <string> <expr>* )
function invoke(node) {
  const [name, ...exprs] = node.args;

  // find export in instantiated module

  const module = instantiatedModules.find(
    ({ exports }) => exports[name.value] !== undefined
  );

  assert(module !== undefined, `Module with export "${name.value}" not found`);

  const args = exprs.map(expr => {
    const evaluation = partialEvaluation.evaluate(allocator, [expr]);

    if (evaluation !== undefined) {
      return evaluation.value.toString();
    }
  });

  const res = module.exports[name.value](...args);
  return res;
}

/**
 * REPL
 */
const memory = new Memory({ initial: 100 });
const allocator = createAllocator(memory);

// Cache instanced modules
const instantiatedModules = [];

const filename = process.argv[2];

function assert(cond, msg = "unknown") {
  if (cond === false) {
    error(new Error("assertion failure: " + msg));

    if (filename !== undefined) {
      process.exit(1);
    }
  }
}

function countChar(char) {
  return str =>
    str.split("").reduce((acc, e) => {
      if (e === char) {
        acc++;
      }

      return acc;
    }, 0);
}

const countOpeningParens = countChar("(");
const countClosingParens = countChar(")");

// Buffer used to store incomplet user input
let buffer = "";
let openParens = 0;

function error({ message }) {
  console.log("Error: " + message);
}

function createInstanceFromAst(moduleNode) {
  const importObject = {};
  const module = createCompiledModule(moduleNode);

  return new Instance(module, importObject);
}

function replEval(input) {
  const ast = _debug.parseWATFSpecTest(input);
  const [node] = ast.body;

  if (isVerbose === true) {
    console.log(input);
  }

  // Empty input, skip this iteration
  if (node === undefined) {
    return;
  }

  if (node.type === "Instr") {
    if (node.id === "assert_invalid") {
      assert_invalid(node);
    }

    if (node.id === "assert_return") {
      assert_return(node);
    }

    if (node.id === "invoke") {
      invoke(node);
    }

    if (node.id === "assert_return_canonical_nan") {
      throw new Error("assert_return_canonical_nan: not implemented yet");
    }

    if (node.id === "assert_return_arithmetic_nan") {
      throw new Error("assert_return_arithmetic_nan: not implemented yet");
    }

    if (node.id === "assert_trap") {
      throw new Error("assert_trap: not implemented yet");
    }

    if (node.id === "assert_malformed") {
      throw new Error("assert_malformed: not implemented yet");
    }

    if (node.id === "assert_malformed") {
      throw new Error("assert_unlinkable: not implemented yet");
    }
  }

  if (node.type === "Module") {
    const instance = createInstanceFromAst(node);

    prettyPrintInstance(instance);

    instantiatedModules.push(instance);
  }
}

function read(input) {
  // FIXME(sven): the parser should handle comments but let's ignore them for
  // now
  if (input[0] === ";") {
    return;
  }

  openParens += countOpeningParens(input);
  openParens -= countClosingParens(input);

  buffer += input;

  if (openParens === 0) {
    replEval(buffer);

    buffer = "";
  }

  if (filename === undefined) {
    process.stdout.write(" > ");
  }
}

function prettyPrintInstance(instance) {
  if (filename !== undefined) {
    return;
  }

  const exports = Object.keys(instance.exports).map(
    name => `  export func "${name}"`
  );

  console.log("module:");
  console.log(exports.join("\n"));
}

if (filename === undefined) {
  const rl = readline.createInterface({
    input: process.stdin
  });

  process.stdout.write("wasm 1.0 JavaScript interpreter\n");
  process.stdout.write("> ");

  rl.on("line", read);
} else {
  const rl = readline.createInterface({
    input: createReadStream(filename)
  });

  rl.on("line", read);
}
