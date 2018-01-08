// @flow

const { traverse } = require("../AST/traverse");
const funcResultTypeValidation = require("../validation/func-result-type");

function validateAST(ast: Program) {
  funcResultTypeValidation.validate(ast);
}

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
  const exports = [];
  const imports = [];

  traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        exports.push({
          name: node.descr.id,
          kind: "function"
        });
      }
    }
  });

  return new Module(ast, exports, imports);
}
