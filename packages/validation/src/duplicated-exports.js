// @flow

import { traverse } from "@webassemblyjs/ast";

function duplicatedExports(name: string): string {
  return `duplicate export name "${name}"`;
}

export default function validate(ast: Program): Array<string> {
  const errors = [];

  const seenExports = {};

  traverse(ast, {
    ModuleExport(path: NodePath<ModuleExport>) {
      const { name } = path.node;

      if (seenExports[name] !== undefined) {
        return errors.push(duplicatedExports(name));
      }

      seenExports[name] = true;
    }
  });

  return errors;
}
