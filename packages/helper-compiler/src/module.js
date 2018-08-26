// @flow

import { define, assert } from "mamacro";
import {
  traverse,
  getFunctionBeginingByteOffset,
  getEndBlockByteOffset,
  getStartByteOffset,
  isCallInstruction,
  isBlock
} from "@webassemblyjs/ast";

declare function LABEL_POP(): void;
declare function LABEL_PUSH(n: Node): void;
declare function EMIT(n: Node): void;

define(
  LABEL_POP,
  () => `
    this._labels.pop();
  `
);

define(
  EMIT,
  node => `
    const node = ${node};
    const offset = getStartByteOffset(node);

    this._program.push({ offset, node });
  `
);

define(
  LABEL_PUSH,
  node => `
    this._labels.push(${node});
  `
);

/**
 * ModuleContext
 *
 * TODO(sven): refactor current implementation?
 */
type Context = {
  funcs: Array<Func>
};

function createContext(ast: Program): Context {
  const context = {
    funcs: []
  };

  traverse(ast, {
    Func(path: NodePath<Func>) {
      context.funcs.push(path.node);
    }
  });

  return context;
}

export class Module {
  _labels: Array<Node>;
  _program: Array<Node>;
  _currentFunc: ?Func;
  _context: Context;

  constructor(ast: Program) {
    this._labels = [];
    this._program = [];
    this._currentFunc = null;

    this._context = createContext(ast);
  }

  beginFuncBody(func: Func) {
    this._labels = [];
    this._program = [];
    this._currentFunc = func;

    LABEL_PUSH(func);
  }

  onFuncInstruction(node: Instruction) {
    if (isCallInstruction(node)) {
      assert(node.initial !== null);

      const funcIndex = node.initial.value;
      const func = this._context.funcs[funcIndex];
      assert(func !== null);

      // transform module index into byte offset
      node.index.value = getFunctionBeginingByteOffset(func);
    }

    if (isBlock(node)) {
      LABEL_PUSH(node);
    }

    if (node.id === "br") {
      const depth = node.args[0].value;
      const target = this._labels[this._labels.length - depth - 1];
      assert(target !== null);

      // targets the end instruction
      node.args[0].value = getEndBlockByteOffset(target);
    }

    EMIT(node);
  }

  finalizeFunc(func: Func) {
    LABEL_POP();

    this._currentFunc = null;

    return {
      name: func.name.value,
      startAt: getFunctionBeginingByteOffset(func),
      instructions: this._program
    };
  }
}
