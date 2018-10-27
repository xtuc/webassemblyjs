// @flow

import { assert } from "mamacro";
import { execSync } from "child_process";
import { basename, join } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { decode } from "@webassemblyjs/wasm-parser";
import { parse } from "@webassemblyjs/wast-parser";
import { createCompiledModule } from "webassemblyjs/lib/compiler/compile/module";
import { Instance } from "webassemblyjs/lib/interpreter";

import {
  assert_return,
  assert_malformed,
  assert_invalid,
  assert_trap
} from "./asserts";

const WASM_TEST_DIR = "./wasm_test_dir";

function getModuleName(command: Command): string {
  return command.name || "__default";
}

const decoderOpts = {};

type Command = {
  line: number,
  name: string,
  filename: string,
  type: string,
  module_type: "text" | "binary",
  text: string,
  action: Object,
  expected: Object
};

type Manifest = {
  source_filename: string,
  commands: Array<Command>
};

let lastInstance;
const namedInstances = {};

export default function run(filename: string) {
  assert(typeof filename === "string", "please specify a filename");

  if (existsSync(WASM_TEST_DIR) === false) {
    mkdirSync(WASM_TEST_DIR);
  }

  // generate wasm files

  const out = basename(filename);
  const manifestOut = join(WASM_TEST_DIR, out + ".json");

  execSync(`wast2json --debug-names ${filename} -o ${manifestOut}`);

  // run tests

  const manifest: Manifest = JSON.parse(readFileSync(manifestOut, "utf8"));

  manifest.commands.forEach(command => {
    switch (command.type) {
      case "module": {
        // $FlowIgnore
        lastInstance = namedInstances[getModuleName(command)] = loadModule(
          "binary",
          command.filename
        );
        break;
      }

      case "assert_return": {
        assert(namedInstances[getModuleName(command)] !== undefined);

        const fn = getExportedElement(
          command.action.field,
          command.action.module
        );

        assert_return(fn, command.action, command.expected);
        break;
      }

      case "assert_malformed": {
        assert_malformed(
          () => loadModule(command.module_type, command.filename),
          command.text
        );
        break;
      }

      case "assert_invalid": {
        assert_invalid(
          () => loadModule(command.module_type, command.filename),
          command.text
        );
        break;
      }

      case "assert_trap": {
        const fn = getExportedElement(
          command.action.field,
          command.action.module
        );

        assert_trap(fn, command.action, command.text);
        break;
      }

      default:
        throw new Error("unknown command: " + command.type);
    }

    console.log("PASS " + commandToString(command));
  });
}

function commandToString(command: Command): string {
  let out = "";

  out += command.type;

  if (command.text !== undefined) {
    out += " " + command.text;
  }

  out += " at line " + command.line;

  return out;
}

function getExportedElement(name: string, moduleName: ?string): Object {
  if (lastInstance.exports[name] !== undefined) {
    return lastInstance.exports[name];
  }

  assert(moduleName !== undefined, "no named module for " + name);

  // $FlowIgnore: asserted above
  const instance = namedInstances[moduleName];
  assert(
    instance !== undefined,
    `module instance ${String(moduleName)} not found`
  );

  // $FlowIgnore: asserted above
  const fn = instance.exports[name];
  assert(
    fn !== undefined,
    `function ${name} not found in ${String(moduleName)}`
  );

  return fn;
}

function loadModule(type: string, filename: string): Instance {
  const internalInstanceOptions = {
    checkForI64InSignature: false,
    returnStackLocal: true
  };

  const importObject = {
    _internalInstanceOptions: internalInstanceOptions
  };

  if (type === "text") {
    const content = readFileSync(join(WASM_TEST_DIR, filename), "utf8");

    // we need a module in order to be compiled
    const ast = parse("(module " + content + ")");

    // TODO(sven): pass fakeCompiler here?
    const module = createCompiledModule(ast);

    return new Instance(module, importObject);
  } else if (type === "binary") {
    // $FlowIgnore
    const buff = readFileSync(join(WASM_TEST_DIR, filename), null);

    const ast = decode(buff, decoderOpts);
    const module = createCompiledModule(ast);
    return new Instance(module, importObject);
  } else {
    throw new Error("unsupported module type: " + type);
  }
}
