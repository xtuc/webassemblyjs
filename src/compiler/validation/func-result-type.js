// @flow

const { traverse } = require("../AST/traverse");

const UNKNOWN_TYPE = "unknown";

function getInstructionResultType(i: Instruction | ObjectInstruction) {
  // For example: i32.const, results in a i32
  // This obviously doesn't cover all the cases
  if (typeof i.object === "string") {
    return i.object;
  }

  return UNKNOWN_TYPE;
}

export function validate(ast: Program) {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      const resultType = node.result;
      const [lastInstruction] = node.body;

      // Function has no result types or last instruction, we can skip it
      if (
        typeof resultType !== "string" ||
        typeof lastInstruction === "undefined"
      ) {
        return;
      }

      const lastInstructionResultType = getInstructionResultType(
        lastInstruction
      );

      // Type is unknown, we can not verify the result type
      if (lastInstructionResultType === UNKNOWN_TYPE) {
        return;
      }

      if (resultType !== lastInstructionResultType) {
        let name = "anonymous";

        if (node.name != null) {
          name = node.name.value;
        }

        errors.push(
          `- function '${name}' expected result type ${resultType},` +
            ` but ${lastInstructionResultType} given.`
        );

        return;
      }
    }
  });

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}
