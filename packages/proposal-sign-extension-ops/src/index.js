import { edit } from "@webassemblyjs/wasm-edit";
import { traverse, callInstruction, numberLiteral } from "@webassemblyjs/ast";
import i32_extend8_s from "./polyfills/i32_extend8_s.json";

export function transformAst(ast) {
  let polyfillIndex = 0;
  let needsPolyfill = false;

  const countFuncVisitor = {
    Func(path) {
      ++polyfillIndex;
    }
  };

  const signExtendVisitor = polyfillIndex => ({
    Instr(path) {
      if (path.node.id === "i32_extend8_s") {
        needsPolyfill = true;
        path.replaceWith(
          callInstruction(numberLiteral(polyfillIndex, String(polyfillIndex)))
        );
      }
    }
  });

  traverse(ast, countFuncVisitor);

  traverse(ast, signExtendVisitor(polyfillIndex));

  if (needsPolyfill) {
    ast.body[0].fields.push(i32_extend8_s);
  }

  return ast;
}
