import { edit } from '@webassemblyjs/wasm-edit';
import { traverse } from '@webassemblyjs/ast';

export function transformAst(ast) {
  traverse(ast, signExtendVisitor);
  return ast
}

const signExtendVisitor = {
  Instr(path) {
    console.log(path.node);
  }
}
