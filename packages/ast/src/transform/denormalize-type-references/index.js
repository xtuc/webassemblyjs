// @flow
const t = require("../../index");

// func and call_indirect instructions can either define a signature inline, or
// reference a signature, e.g.
//
// ;; inline signature
// (func (result i64)
//   (i64.const 2)
// )
// ;; signature reference
// (type (func (result i64)))
// (func (type 0)
//   (i64.const 2))
// )
//
// this AST transform denormalises the type references, making all signatures within the module
// inline.
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

  function denormalizeSignature(
    signature: SignatureOrTypeRef
  ): SignatureOrTypeRef {
    // signature referenced by identifier
    if (signature.type === "Identifier") {
      const identifier: Identifier = signature;
      const typeInstruction = typeInstructions.find(
        t => t.id.type === identifier.type && t.id.value === identifier.value
      );

      if (!typeInstruction) {
        throw new Error(
          `A type instruction reference was not found ${JSON.stringify(
            signature
          )}`
        );
      }

      return typeInstruction.functype;
    }

    // signature referenced by index
    if (signature.type === "NumberLiteral") {
      const signatureRef: NumberLiteral = signature;
      const typeInstruction = typeInstructions[signatureRef.value];
      return typeInstruction.functype;
    }

    return signature;
  }

  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      node.signature = denormalizeSignature(node.signature);
    },
    CallIndirectInstruction({ node }: NodePath<Func>) {
      node.signature = denormalizeSignature(node.signature);
    }
  });
}
