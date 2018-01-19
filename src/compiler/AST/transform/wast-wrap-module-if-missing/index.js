// @flow

const t = require("../../index");

export function transform(ast: Program) {
  const [firstNode] = ast.body;

  if (firstNode.type !== "Module") {
    const id = null;
    const moduleNode = t.module(id, ast.body);

    ast.body = [moduleNode];
  }
}
