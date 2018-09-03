// @flow

import { transform as wastIdentifierToIndex } from "@webassemblyjs/ast/lib/transform/wast-identifier-to-index";
import { transform as denormalizeTypeReferences } from "@webassemblyjs/ast/lib/transform/denormalize-type-references";
import { toIR } from "@webassemblyjs/helper-compiler";

const t = require("@webassemblyjs/ast");

import validateAST from "@webassemblyjs/validation";

export class Module {
  _ast: Program;
  _ir: IR;

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;

  constructor(
    ir: IR,
    ast: Program,
    exports: Array<CompiledModuleExportDescr>,
    imports: Array<CompiledModuleImportDescr>
  ) {
    this._ir = ir;
    this._ast = ast;

    this.exports = exports;
    this.imports = imports;
  }
}

export function createCompiledModule(ast: Program): CompiledModule {
  const exports: Array<CompiledModuleExportDescr> = [];
  const imports = [];

  // Do compile-time ast manipulation in order to remove WAST
  // semantics during execution
  denormalizeTypeReferences(ast);
  wastIdentifierToIndex(ast);

  validateAST(ast);

  t.traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.exportType === "Func") {
        exports.push({
          name: node.name,
          kind: "function"
        });
      }
    }
  });

  /**
   * Compile
   */
  const ir = toIR(ast);

  return new Module(ir, ast, exports, imports);
}
