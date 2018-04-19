// @flow

import { transform as wastIdentifierToIndex } from "@webassemblyjs/ast/lib/transform/wast-identifier-to-index";
import { transform as denormalizeTypeReferences } from "@webassemblyjs/ast/lib/transform/denormalize-type-references";

const t = require("@webassemblyjs/ast");

import validateAST from "@webassemblyjs/validation";
const { CompileError } = require("../../errors");

export class Module {
  _start: ?Funcidx;
  _ast: Program;

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;

  constructor(
    ast: Program,
    exports: Array<CompiledModuleExportDescr>,
    imports: Array<CompiledModuleImportDescr>,
    start?: Funcidx
  ) {
    this._ast = ast;
    this._start = start;

    this.exports = exports;
    this.imports = imports;
  }
}

export function createCompiledModule(ast: Program): CompiledModule {
  const exports: Array<CompiledModuleExportDescr> = [];
  const imports = [];

  let start;

  // Do compile-time ast manipulation in order to remove WAST
  // semantics during execution
  denormalizeTypeReferences(ast);
  wastIdentifierToIndex(ast);

  validateAST(ast);

  t.traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        exports.push({
          name: node.name,
          kind: "function"
        });
      }
    },

    Start({ node }: NodePath<Start>) {
      if (typeof start !== "undefined") {
        throw new CompileError("Multiple start functions is not allowed");
      }

      start = node.index;
    }
  });

  /**
   * Adds missing end instructions
   */
  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      node.body.push(t.instruction("end"));
    },

    Global({ node }: NodePath<Global>) {
      node.init.push(t.instruction("end"));
    },

    IfInstruction({ node }: NodePath<IfInstruction>) {
      node.test.push(t.instruction("end"));
      node.consequent.push(t.instruction("end"));
      node.alternate.push(t.instruction("end"));
    },

    BlockInstruction({ node }: NodePath<BlockInstruction>) {
      node.instr.push(t.instruction("end"));
    },

    LoopInstruction({ node }: NodePath<LoopInstruction>) {
      node.instr.push(t.instruction("end"));
    }
  });

  return new Module(ast, exports, imports, start);
}
