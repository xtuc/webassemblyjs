// @flow

import { define, assert } from "mamacro";
import {
  traverse,
  getFunctionBeginingByteOffset,
  getEndBlockByteOffset,
  // eslint-disable-next-line no-unused-vars
  getStartByteOffset,
  isCallInstruction,
  isIfInstruction,
  isBlock,
  internalBrUnless,
  internalGoto,
  getEndByteOffset
} from "@webassemblyjs/ast";

declare function LABEL_POP(): void;
declare function LABEL_PUSH(n: Node): void;

define(
  LABEL_POP,
  () => `
    this._labels.pop();
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

  _emit(node: Node) {
    const offset = getStartByteOffset(node);

    this._program.push({ offset, node });
  }

  beginFuncBody(func: Func) {
    this._labels = [];
    this._program = [];
    this._currentFunc = func;

    LABEL_PUSH(func);
  }

  onFuncInstruction(node: Instruction) {
    if (isCallInstruction(node)) {
      assert(node.numeric !== null);

      const funcIndex = node.numeric.value;
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

    if (isIfInstruction(node)) {
      const alternateOffset = getStartByteOffset(node.alternate[0]);
      const internalBrUnlessNode = internalBrUnless(alternateOffset);
      internalBrUnlessNode.loc = node.loc;

      this._emit(internalBrUnlessNode);

      node.consequent.forEach(n => this._emit(n));

      // Skipping the alternate once the consequent block has been executed.
      // We inject a goto at the offset of the else instruction
      //
      // TODO(sven): properly replace the else instruction instead, keep it in
      // the ast.
      const internalGotoNode = internalGoto(
        getEndByteOffset(node.alternate[node.alternate.length - 1])
      );

      internalGotoNode.loc = {
        start: {
          line: -1,
          column: node.alternate[0].loc.start.column - 1
        }
      };

      this._emit(internalGotoNode);

      node.alternate.forEach(n => this._emit(n));

      return;
    }

    this._emit(node);
  }

  finalizeFunc(func: Func) {
    LABEL_POP();

    // transform the function body `end` into a return
    this._program[this._program.length - 1].node.id = "return";

    this._currentFunc = null;

    return {
      name: func.name.value,
      startAt: getFunctionBeginingByteOffset(func),
      instructions: this._program
    };
  }
}
