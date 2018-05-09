// @flow
import { RuntimeError } from "webassemblyjs/lib/errors";
import { traverse } from "@webassemblyjs/ast";
const { getType, typeEq } = require("./type-inference");

export default function validate(ast: Program): Array<string> {
  const errors = [];

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      if (node.signature.type !== "Signature") {
        throw new RuntimeError(
          "Function signatures must be denormalised before execution"
        );
      }

      const signature = (node.signature: Signature);
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      const resultType = signature.results;

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
