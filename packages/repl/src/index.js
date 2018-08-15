const {
  createCompiledModule
} = require("webassemblyjs/lib/compiler/compile/module");
const { Instance } = require("webassemblyjs/lib/interpreter");
const partialEvaluation = require("webassemblyjs/lib/interpreter/partial-evaluation");
const { parse } = require("@webassemblyjs/wast-parser");
const {
  Memory
} = require("webassemblyjs/lib/interpreter/runtime/values/memory");
const {
  createAllocator
} = require("webassemblyjs/lib/interpreter/kernel/memory");
const { decode } = require("@webassemblyjs/wasm-parser");
const t = require("@webassemblyjs/ast");
const typeCheck = require("@webassemblyjs/validation").stack;
const denormalizeTypeReferences = require("@webassemblyjs/ast/lib/transform/denormalize-type-references")
  .transform;

function addEndInstruction(body) {
  body.push(t.instruction("end"));
}

export function createRepl({ isVerbose, onAssert, onLog, onOk }) {
  function parseQuoteModule(node /*: QuoteModule */) {
    const raw = node.string.join("");
    parse(raw);
  }

  function decodeBinaryModule(node /*: BinaryModule */) {
    const raw = node.blob.join("");
    const chars = raw.split("");

    const out = [];

    for (let i = 0; i < chars.length; i++) {
      const e = chars[i];

      if (e === "\\") {
        // Start espace sequence
        const byte = chars[i + 1] + chars[i + 2];
        const hexInNumber = parseInt(byte, 16);

        out.push(hexInNumber);

        i = i + 2;
      } else {
        // ASCII
        const hexInNumber = Number(chars[i].charCodeAt(0));
        out.push(hexInNumber);
      }
    }

    decode(out);
  }

  /**
   * Assert helpers
   */

  // ;; assert module cannot be decoded with given failure string
  // ( assert_malformed <module> <failure> )
  function assert_malformed(node) {
    const [module, expected] = node.args;

    if (t.isBinaryModule(module) === true) {
      try {
        decodeBinaryModule(module);
        assert(
          false,
          `module is valid, expected malformed (${expected.value})`
        );
      } catch (err) {
        assert(
          new RegExp(expected.value, "ig").test(err.message),
          `Expected failure of "${expected.value}", "${err.message}" given`
        );
      }
    } else if (t.isQuoteModule(module) === true) {
      try {
        parseQuoteModule(module);
        assert(
          false,
          `module is valid, expected malformed (${expected.value})`
        );
      } catch (err) {
        assert(
          new RegExp(expected.value, "ig").test(err.message),
          `Expected failure of "${expected.value}", "${err.message}" given`
        );
      }
    } else {
      throw new Error("Unsupported module type: " + module.type);
    }
  }

  // assert module traps on instantiation
  // ( assert_trap <module> <failure> )
  function assert_trap(node) {
    const [action, expected] = node.args;

    if (action.type === "Instr" && action.id === "invoke") {
      try {
        invoke(action);
        assert(false, `invoke is valid, expected trapped (${expected.value})`);
      } catch (err) {
        assert(
          err.message.toLowerCase() === expected.value.toLowerCase(),
          `Expected failure of ${expected.value}, ${err.message} given`
        );
      }
    } else {
      throw new Error("Unsupported action: " + action.id);
    }
  }

  // assert module is invalid with given failure string
  // ( assert_invalid <module> <failure> )
  function assert_invalid(node) {
    const [module, expected] = node.args;

    try {
      const enableTypeChecking =
        expected.value === "type mismatch" ||
        expected.value === "global is immutable";

      createModuleInstanceFromAst(module, enableTypeChecking);
      assert(false, `module is valid, expected invalid (${expected.value})`);
    } catch (err) {
      assert(
        new RegExp(expected.value, "ig").test(err.message),
        `Expected failure of "${expected.value}", "${err.message}" given`
      );
    }
  }

  // assert action has expected results
  // ( assert_return <action> <expr>* )

  // action:
  //   ( invoke <name>? <string> <expr>* )        ;; invoke function export
  //   ( get <name>? <string> )                   ;; get global export

  function assert_return(node) {
    const [action, ...args] = node.args;

    addEndInstruction(args);
    const expectedRes = partialEvaluation.evaluate(allocator, args);

    if (action.type === "Instr" && action.id === "invoke") {
      const actualRes = invoke(action);

      assertSameStackLocal(actualRes, expectedRes);
    } else if (action.type === "Instr" && action.id === "get") {
      let id;

      if (action.args.length === 2) {
        id = action.args[1];
      } else {
        id = action.args[0];
      }

      // find export in instantiated module
      const module = instantiatedModules.find(
        ({ exports }) => exports[id.value] !== undefined
      );

      const actualRes = module.exports[id.value];

      assertSameStackLocal(actualRes, expectedRes);
    } else {
      throw new Error("Unsupported action in assert_return: " + action.id);
    }
  }

  // invoke function export
  // ( invoke <name>? <string> <expr>* )
  function invoke(node) {
    const [first, ...args] = node.args;

    let name = first;

    if (first.type === "Identifier") {
      // Module name
      // TODO(sven): ignore for now since we need to add an Identifier on the
      // module

      name = args.shift();
    }

    // find export in instantiated module
    const module = instantiatedModules.find(
      ({ exports }) => exports[name.value] !== undefined
    );

    assert(
      module !== undefined,
      `Module with export "${name.value}" not found`
    );

    const argValues = args.map(expr => {
      const code = [expr];
      addEndInstruction(code);
      const evaluation = partialEvaluation.evaluate(allocator, code);

      if (evaluation !== undefined) {
        // Pass the raw value here since we need the LongNumber representation
        // It's only meant for testing
        if (expr.object === "i64") {
          return evaluation.value._value;
        }

        return evaluation.value.toString();
      }
    });

    return module.exports[name.value](...argValues);
  }

  /**
   * REPL
   */
  const memory = new Memory({ initial: 100 });
  const allocator = createAllocator(memory);

  // Cache instanced modules
  const instantiatedModules = [];

  function wrapInModule(node) {
    const name = "autogenerated";
    return t.module(name, [node]);
  }

  function assert(cond, msg = "unknown") {
    if (cond === false) {
      error(new Error("assertion failure: " + msg));
      onAssert();

      return;
    }

    onOk();

    if (isVerbose === true) {
      onLog("Assertion OK");
    }
  }

  function assertSameStackLocal(actual, expected) {
    if (actual === undefined && expected === undefined) {
      return;
    }

    assert(typeof actual !== "undefined", "Actual value is undefined");

    const actualType = actual.type;
    const expectedType = expected.type;

    assert(
      actualType === expectedType,
      `Type expected "${expectedType}", "${actualType}" given`
    );

    const actualValue = actual.value.toString();
    const expectedValue = expected.value.toString();

    assert(
      actualValue === expectedValue,
      `Value expected "${expectedValue}", "${actualValue}" given`
    );
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

  function error({ message, stack }) {
    onLog("Error: " + message);

    if (isVerbose === true) {
      onLog(stack);
    }
  }

  function createModuleInstanceFromAst(moduleNode, enableTypeChecking = false) {
    const internalInstanceOptions = {
      checkForI64InSignature: false,
      returnStackLocal: true
    };

    const importObject = {
      _internalInstanceOptions: internalInstanceOptions
    };

    if (enableTypeChecking === true) {
      denormalizeTypeReferences(moduleNode);

      const typeErrors = typeCheck(t.program([moduleNode]));

      if (typeErrors.length > 0) {
        const containsImmutableGlobalViolation = typeErrors.some(
          x => /global is immutable/.match(x)
        );

        if (containsImmutableGlobalViolation) {
          throw new Error("global is immutable");
        }

        throw new Error("type mismatch");
      }
    }

    const compiledModule = createCompiledModule(moduleNode);

    return new Instance(compiledModule, importObject);
  }

  function replEval(input) {
    if (isVerbose === true) {
      onLog(input);
    }

    const ast = parse(input);
    const [node] = ast.body;

    // Empty input, skip this iteration
    if (node === undefined) {
      return;
    }

    if (node.type === "Instr") {
      if (node.id === "assert_invalid") {
        return assert_invalid(node);
      }

      if (node.id === "assert_return") {
        return assert_return(node);
      }

      if (node.id === "invoke") {
        return invoke(node);
      }

      if (node.id === "assert_return_canonical_nan") {
        throw new Error("assert_return_canonical_nan: not implemented yet");
      }

      if (node.id === "assert_return_arithmetic_nan") {
        throw new Error("assert_return_arithmetic_nan: not implemented yet");
      }

      if (node.id === "assert_trap") {
        return assert_trap(node);
      }

      if (node.id === "assert_malformed") {
        return assert_malformed(node);
      }

      if (node.id === "assert_unlinkable") {
        throw new Error("assert_unlinkable: not implemented yet");
      }
    } else if (node.type === "Module") {
      const instance = createModuleInstanceFromAst(node);

      instantiatedModules.unshift(instance);
    } else {
      // else wrap the instruction it into a module and interpret it
      createModuleInstanceFromAst(wrapInModule(node));
    }
  }

  function read(input) {
    openParens += countOpeningParens(input);
    openParens -= countClosingParens(input);

    buffer += input + "\n";

    if (openParens === 0) {
      try {
        replEval(buffer);
      } catch (err) {
        error(err);
      }

      buffer = "";
    }
  }

  return {
    read
  };
}
