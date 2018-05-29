import compiler from "webassembly/cli/compiler";
import { decode } from "@webassemblyjs/wasm-parser";

import { readFileSync, writeFileSync } from "fs";

import path from "path";
import mkdirp from "mkdirp";

export function generateAsts() {
  compiler.main(
    [
      "-o",
      "./packages/proposal-sign-extension-ops/src/polyfills/i32_extend8_s.wasm",
      "--optimize",
      path.resolve(
        "./packages/proposal-sign-extension-ops/src/polyfills/i32_extend8_s.c"
      )
    ],
    function(err, filename) {
      if (err) {
        throw err;
      }
      console.log("saved to: " + filename);

      const wasmFile = readFileSync(filename);

      const ast = decode(wasmFile);

      const i32_extend8_s = ast.body[0].fields.filter(
        f => f.type === "Func"
      )[0];

      mkdirp(
        path.resolve("./packages/proposal-sign-extension-ops/lib/polyfills")
      );

      writeFileSync(
        path.resolve(
          "./packages/proposal-sign-extension-ops/lib/polyfills/i32_extend8_s.json"
        ),
        JSON.stringify(i32_extend8_s, null, 2)
      );
    }
  );
}
