// @flow

const { traverse } = require("../AST/traverse");
const { getType } = require("./type-inference");

export default function validate(ast: Program): Array<string> {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      const [resultType] = node.result;

      // Function has no result types or last instruction, we can skip it
      if (typeof resultType !== "string") {
        return;
      }

      const lastInstructionResultType = getType(node.body);

      // Type is unknown, we can not verify the result type
      if (!lastInstructionResultType) {
        return;
      }

      if (resultType != lastInstructionResultType) {
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
