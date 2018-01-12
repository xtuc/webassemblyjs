// @flow

const { traverse } = require("../../AST/traverse");
const t = require("../../AST");

const IMPORT_MODULE = "test";

const instructions = [
  "assert_return",
  "assert_return_canonical_nan",
  "assert_return_arithmetic_nan",
  "assert_trap",
  "assert_malformed",
  "assert_unlinkable"
];

function createCallInstructionNode(name: string): CallInstruction {
  const index = t.identifier(name);

  return t.callInstruction(index);
}

function createImportInstructionNode(functionName: string): ModuleImport {
  const descr = t.funcImportDescr(t.identifier(functionName), [], []);

  return t.moduleImport(IMPORT_MODULE, functionName, descr);
}

export function transform(ast: Program) {
  const importInstructions = [];

  traverse(ast, {
    Instr(path: NodePath<Instr>) {
      const { node } = path;
      const funcName = node.id;

      if (instructions.indexOf(funcName) !== -1) {
        path.node = Object.assign(
          path.node,
          createCallInstructionNode(funcName)
        );

        importInstructions.push(createImportInstructionNode(funcName));
      }
    }
  });

  // Add importInstructions on top of the module
  if (importInstructions.lengh !== 0) {
    traverse(ast, {
      Module(path: NodePath<Module>) {
        path.node.fields.unshift(...importInstructions);
      }
    });
  }
}
