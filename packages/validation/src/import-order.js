// @flow

import { traverse } from "@webassemblyjs/ast";

// https://webassembly.github.io/spec/core/text/modules.html#text-module
//
// imports must appear before globals, memory, tables or functions. However, imports
// may be embedded within other statetemnts, or statetemnts may be embedded within imports.
// In these cases, the ordering rule is not applied
export default function validate(ast: Program): Array<string> {
  const errors = [];

  function isImportInstruction(path) {
    // various instructions can be embedded within an import statement. These
    // are not subject to our order validation rule
    return path.parentPath.node.type === "ModuleImport";
  }

  let noMoreImports = false;
  traverse(ast, {
    ModuleImport(path) {
      if (noMoreImports && path.parentPath.node.type !== "Global") {
        return errors.push(
          "imports must occur before all non-import definitions"
        );
      }
    },
    Global(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Memory(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Table(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Func(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    }
  });

  return errors;
}
