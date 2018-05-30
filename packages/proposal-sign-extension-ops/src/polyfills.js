import compiler from "webassembly/cli/compiler";
import { decode } from "@webassemblyjs/wasm-parser";

import { readFileSync, writeFileSync } from "fs";

import path from "path";
import mkdirp from "mkdirp";

const instructions = ["i32_extend8_s", "i32_extend16_s"];

export function generateAsts() {
  instructions.forEach(instr => {
    compiler.main(
      [
        "-o",
        `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.wasm`,
        "--optimize",
        path.resolve(
          `./packages/proposal-sign-extension-ops/src/polyfills/${instr}.c`
        )
      ],
      function(err, filename) {
        if (err) {
          throw err;
        }
        console.log("saved to: " + filename);

        const wasmFile = readFileSync(filename);

        const ast = decode(wasmFile);

        const funcAst = ast.body[0].fields.filter(f => f.type === "Func")[0];

        mkdirp(
          path.resolve("./packages/proposal-sign-extension-ops/lib/polyfills")
        );

        writeFileSync(
          path.resolve(
            `./packages/proposal-sign-extension-ops/lib/polyfills/${instr}.json`
          ),
          JSON.stringify(funcAst, null, 2)
        );
      }
    );
  });
}
