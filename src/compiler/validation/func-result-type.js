// @flow

const { traverse } = require("../AST/traverse");
const { getType, typeEq } = require("./type-inference");

export default function validate(ast: Program): Array<string> {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      const resultType = node.result;

      const inferedResultType = getType(node.body);

      // Type is unknown, we can not verify the result type
      if (typeof inferedResultType === "undefined") {
        return;
      }

      // $FlowIgnore
      if (typeEq(resultType, inferedResultType) === false) {
        let name = "anonymous";

        if (node.name != null) {
          name = node.name.value;
        }

        errors.push(
          `- Type mismatch: function '${name}' expected result type ${JSON.stringify(
            resultType
          )},` + ` but ${JSON.stringify(inferedResultType)} given.`
        );

        return;
      }
    }
  });

  return errors;
}
