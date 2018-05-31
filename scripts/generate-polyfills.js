#!/usr/bin/env node

const asc =  require("assemblyscript/cli/asc")
const { decode } = require("../packages/wasm-parser/lib/");

const { readFileSync, writeFileSync, copyFileSync } = require("fs");

const path = require("path");
const mkdirp = require("mkdirp");

const instructions = ["i32_extend8_s", "i32_extend16_s", "i64_extend8_s", "i64_extend16_s", "i64_extend32_s"];

instructions.forEach(instr => {
  console.log(`Generating polyfill for ${instr}...`)
  asc.main(
    [
      `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.ts`,
      "--binaryFile",
      `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.wasm`,
      "--optimize"
    ],
    {
      stdout: process.stdout,
      stderr: process.stderr
    },
    function(err) {
      if (err) throw err;

      console.log("Successfuly compiled polyfill from TypeScript to wasm.")

      const wasmFile = readFileSync(
        `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.wasm`
      );

      const ast = decode(wasmFile);
      const funcAst = ast.body[0].fields.filter(f => f.type === "Func")[0];

      console.log("Successfuly decoded wasm polyfill into AST.")

      mkdirp(
        path.resolve("./packages/proposal-sign-extension-ops/src/polyfills")
      );

      writeFileSync(
        path.resolve(
          `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.json`
        ),
        JSON.stringify(funcAst, null, 2)
      );

      copyFileSync(
        path.resolve(
          `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.json`
        ),
        path.resolve(
          `./packages/proposal-sign-extension-ops/lib/polyfills/${instr}.json`
        )
      );

      console.log("Successfuly stored JSON source for polyfill.")
    }
  );
});

