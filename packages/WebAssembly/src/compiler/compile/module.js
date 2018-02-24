// @flow

import { traverse } from "@webassemblyjs/ast/lib/traverse";
import wastIdentifierToIndex from "@webassemblyjs/ast/lib/transform/wast-identifier-to-index";

import validateAST from "../validation";
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
    validateAST(ast);

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
  wastIdentifierToIndex.transform(ast);

  traverse(ast, {
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

  return new Module(ast, exports, imports, start);
}
