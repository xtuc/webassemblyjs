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

export default function validate(ast: Program): Array<string> {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      const [resultType] = node.result;
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

  return errors;
}
