// @flow

import { define, assert } from "mamacro";
import {
  getEndBlockByteOffset,
  getEndByteOffset,
  getFunctionBeginingByteOffset,
  getStartBlockByteOffset,
  getStartByteOffset,
  internalBrUnless,
  internalGoto,
  internalCallExtern,
  isBlock,
  isLoopInstruction,
  isCallInstruction,
  isFuncImportDescr,
  isIdentifier,
  isIfInstruction,
  isNumberLiteral,
  internalEndAndReturn,
  traverse
} from "@webassemblyjs/ast";

export const kStart = Symbol("_start");

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
  funcs: Array<{ node?: Func, isImplemented: boolean }>
};

function createContext(ast: Program): Context {
  const context = {
    funcs: []
  };

  traverse(ast, {
    ModuleImport(path: NodePath<ModuleImport>) {
      if (isFuncImportDescr(path.node.descr)) {
        context.funcs.push({
          isImplemented: false
        });
      }
    },

    Func(path: NodePath<Func>) {
      context.funcs.push({
        isImplemented: true,
        node: path.node
      });
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

      let funcIndex = null;

      if (isNumberLiteral(node.index)) {
        funcIndex = node.index.value;
      }

      if (isIdentifier(node.index)) {
        funcIndex = node.numeric.value;
      }

      assert(funcIndex !== null);

      const funcInContext = this._context.funcs[funcIndex];
      assert(typeof funcInContext === "object");

      if (funcInContext.isImplemented === true) {
        const func = funcInContext.node;

        // transform module index into byte offset
        node.index.value = getFunctionBeginingByteOffset(func);

        this._emit(node);
      } else {
        const internalCallExternNode = internalCallExtern(funcIndex);
        internalCallExternNode.loc = node.loc;

        this._emit(internalCallExternNode);
      }

      return;
    }

    if (isBlock(node)) {
      LABEL_PUSH(node);
    }

    if (isLoopInstruction(node)) {
      LABEL_PUSH(node);
    }

    if (node.id === "br" || node.id === "br_if") {
      const depth = node.args[0].value;
      const target = this._labels[this._labels.length - depth - 1];
      assert(typeof target === "object");

      if (isLoopInstruction(target)) {
        node.args[0].value = getStartBlockByteOffset(target);
      } else {
        node.args[0].value = getEndBlockByteOffset(target);
      }
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

  emitStartFunc(index: number) {
    const funcInContext = this._context.funcs[index];
    assert(typeof funcInContext === "object");
    assert(funcInContext.isImplemented);

    const func = funcInContext.node;

    return {
      name: kStart,
      startAt: getFunctionBeginingByteOffset(func)
    };
  }

  finalizeFunc(func: Func) {
    LABEL_POP();

    // transform the function body `end` into a return
    const lastInstruction = this._program[this._program.length - 1];

    const internalEndAndReturnNode = internalEndAndReturn();
    internalEndAndReturnNode.loc = lastInstruction.node.loc;

    // will be emited at the same location, basically replacing the lastInstruction
    this._emit(internalEndAndReturnNode);

    // clear current function from context
    this._currentFunc = null;

    return {
      name: func.name ? func.name.value : null,
      startAt: getFunctionBeginingByteOffset(func),
      instructions: this._program
    };
  }
}
