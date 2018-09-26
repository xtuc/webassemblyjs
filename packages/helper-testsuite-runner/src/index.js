// @flow

import { assert } from "mamacro";
import { execSync } from "child_process";
import { basename, join } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { decode } from "@webassemblyjs/wasm-parser";
import { parse } from "@webassemblyjs/wast-parser";
import { createCompiledModule } from "webassemblyjs/lib/compiler/compile/module";
import { Instance } from "webassemblyjs/lib/interpreter";

import { assert_return } from "./asserts";

const WASM_TEST_DIR = "./wasm_test_dir";

function getModuleName(command: Command): string {
  return command.name || "__default";
}

type Command = {
  name?: string,
  filename?: string,
  type: string,
  module_type: "text" | "binary",
  action?: Object,
  expected?: Object
};

type Manifest = {
  source_filename: string,
  commands: Array<Command>
};

export default function run(filename: string) {
  assert(typeof filename === "string", "please specify a filename");

  if (existsSync(WASM_TEST_DIR) === false) {
    mkdirSync(WASM_TEST_DIR);
  }

  // generate wasm files

  const out = basename(filename);
  const manifestOut = join(WASM_TEST_DIR, out + ".json");

  execSync(`wast2json ${filename} -o ${manifestOut}`);

  // run tests

  const manifest: Manifest = JSON.parse(readFileSync(manifestOut, "utf8"));

  const instances = {};

  manifest.commands.forEach(command => {
    console.log(command);

    switch (command.type) {
      case "module": {
        // $FlowIgnore
        instances[getModuleName(command)] = loadModule(
          "binary",
          command.filename
        );
        break;
      }

      case "assert_return": {
        assert(instances[getModuleName(command)] !== undefined);

        assert_return(
          instances[getModuleName(command)],
          command.action,
          command.expected
        );
        break;
      }

      default:
        throw new Error("unknown command: " + command.type);
    }
  });
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

    const ast = decode(buff);
    const module = createCompiledModule(ast);
    return new Instance(module, importObject);
  } else {
    throw new Error("unsupported module type: " + type);
  }
}
