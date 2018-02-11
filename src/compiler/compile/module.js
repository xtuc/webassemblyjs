// @flow

const { traverse } = require("../AST/traverse");
import validateAST from "../validation";
const wastIdentifierToIndex = require("../AST/transform/wast-identifier-to-index");

export class Module {
  _ast: Program;

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;

  constructor(
    ast: Program,
    exports: Array<CompiledModuleExportDescr>,
    imports: Array<CompiledModuleImportDescr>
  ) {
    validateAST(ast);

    this._ast = ast;

    this.exports = exports;
    this.imports = imports;
  }
}

export function createCompiledModule(ast: Program): CompiledModule {
  const exports: Array<CompiledModuleExportDescr> = [];
  const imports = [];

  traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        exports.push({
          name: node.name,
          kind: "function"
        });
      }
    }
  });

  // Do compile-time ast manipulation in order to remove WAST
  // semantics during execution
  wastIdentifierToIndex.transform(ast);

  return new Module(ast, exports, imports);
}
