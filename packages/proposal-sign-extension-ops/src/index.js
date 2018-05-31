import { traverse, callInstruction, numberLiteral } from "@webassemblyjs/ast";
import i32_extend8_s from "./polyfills/i32_extend8_s.json";
import i32_extend16_s from "./polyfills/i32_extend16_s.json";

class Polyfills {
  constructor(startIndex) {
    this.startIndex = startIndex;

    this.asts = {
      i32_extend8_s,
      i32_extend16_s
    };

    this.instructions = Object.keys(this.asts);

    this.index = {};

    this.instructions.forEach(instrName => {
      this.index[instrName] = -1;
    });
  }

  replaceWith(path, instrName) {
    if (this.index[instrName] === -1) {
      this.index[instrName] = this.startIndex++;
    }

    const index = this.index[instrName];
    path.replaceWith(callInstruction(numberLiteral(index, String(index))));
  }

  matchesInstruction(instrName) {
    return this.instructions.includes(instrName);
  }

  insertInto(ast) {
    const funcsToPush = Object.keys(this.index)
      .filter(instrName => this.index[instrName] >= 0)
      .sort((x, y) => (this.index[x] > this.index[y] ? 1 : -1))
      .map(instrName => this.asts[instrName]);

    ast.body[0].fields.push(...funcsToPush);
  }
}

export function transformAst(ast) {
  let numberOfFuncs = 0;

  const countFuncVisitor = {
    Func() {
      ++numberOfFuncs;
    }
  };

  traverse(ast, countFuncVisitor);

  const polyfills = new Polyfills(numberOfFuncs);

  const signExtendVisitor = {
    Instr(path) {
      if (polyfills.matchesInstruction(path.node.id)) {
        polyfills.replaceWith(path, path.node.id);
      }
    }
  };

  traverse(ast, signExtendVisitor);

  polyfills.insertInto(ast);

  return ast;
}
