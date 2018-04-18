// @flow
const t = require("../../index");

export function transform(ast: Program) {
  const typeInstructions = [];

  t.traverse(ast, {
    TypeInstruction({ node }) {
      typeInstructions.push(node);
    }
  });

  if (!typeInstructions.length) {
    return;
  }

  t.traverse(ast, {
    Func(nodePath: NodePath<Func>) {
      const node = nodePath.node;

      if (node.signature.type === "Identifier") {
        const signature: Identifier = node.signature;
        const typeInstruction = typeInstructions.find(
          t => t.id.type === signature.type && t.id.value === signature.value
        );

        if (!typeInstruction) {
          throw new Error(
            `A type instruction reference was not found ${JSON.stringify(
              node.signature
            )}`
          );
        }

        node.signature = typeInstruction.functype;
      }

      if (node.signature.type === "NumberLiteral") {
        const signatureRef: NumberLiteral = node.signature;
        const typeInstruction = typeInstructions[signatureRef.value];
        node.signature = typeInstruction.functype;
      }
    }
  });
}
