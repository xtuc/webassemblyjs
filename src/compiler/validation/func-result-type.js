// @flow

const { traverse } = require("../AST/traverse");
const { getType } = require("./type-inference");

function typeEq(l: Array<Valtype>, r: Array<Valtype>): boolean {
  if (l.length !== r.length) {
    return false;
  }

  for (let i = 0; i < l.length; i++) {
    if (l[i] != r[i]) {
      return false;
    }
  }

  return true;
}

export default function validate(ast: Program): Array<string> {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      const resultType = node.result;

      // Function has no result types or last instruction, we can skip it
      if (resultType.length === 0) {
        return;
      }

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
          `- function '${name}' expected result type ${JSON.stringify(
            resultType
          )},` + ` but ${JSON.stringify(inferedResultType)} given.`
        );

        return;
      }
    }
  });

  return errors;
}
