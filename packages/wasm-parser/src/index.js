// @flow
import * as decoder from "./decoder";
import * as t from "@webassemblyjs/ast";

/**
 * TODO(sven): I added initial props, but we should rather fix
 * https://github.com/xtuc/webassemblyjs/issues/405
 */

const defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false,
};

// traverses the AST, locating function name metadata, which is then
// used to update index-based identifiers with function names
function restoreFunctionNames(ast) {
  const functionNames = [];

  t.traverse(ast, {
    FunctionNameMetadata({ node }) {
      functionNames.push({
        name: node.value,
        index: node.index,
      });
    },
  });

  if (functionNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // $FlowIgnore
      const nodeName: Identifier = node.name;
      const indexBasedFunctionName = nodeName.value;
      const index = Number(indexBasedFunctionName.replace("func_", ""));
      const functionName = functionNames.find((f) => f.index === index);
      if (functionName) {
        const oldValue = nodeName.value;

        nodeName.value = functionName.name;
        // $FlowIgnore
        nodeName.numeric = oldValue;

        // $FlowIgnore
        delete nodeName.raw;
      }
    },

    // Also update the reference in the export
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.exportType === "Func") {
        // $FlowIgnore
        const nodeName: NumberLiteral = node.descr.id;
        const index = nodeName.value;
        const functionName = functionNames.find((f) => f.index === index);

        if (functionName) {
          node.descr.id = t.identifier(functionName.name);
        }
      }
    },

    ModuleImport({ node }: NodePath<ModuleImport>) {
      if (node.descr.type === "FuncImportDescr") {
        // $FlowIgnore
        const indexBasedFunctionName: string = node.descr.id;
        const index = Number(indexBasedFunctionName.replace("func_", ""));
        const functionName = functionNames.find((f) => f.index === index);

        if (functionName) {
          // $FlowIgnore
          node.descr.id = t.identifier(functionName.name);
        }
      }
    },

    CallInstruction(nodePath: NodePath<CallInstruction>) {
      const node = nodePath.node;
      const index = node.index.value;
      const functionName = functionNames.find((f) => f.index === index);
      if (functionName) {
        const oldValue = node.index;

        node.index = t.identifier(functionName.name);
        node.numeric = oldValue;

        // $FlowIgnore
        delete node.raw;
      }
    },
  });
}

function restoreLocalNames(ast) {
  const localNames = [];

  t.traverse(ast, {
    LocalNameMetadata({ node }) {
      localNames.push({
        name: node.value,
        localIndex: node.localIndex,
        functionIndex: node.functionIndex,
      });
    },
  });

  if (localNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      const signature = node.signature;
      if (signature.type !== "Signature") {
        return;
      }

      // $FlowIgnore
      const nodeName: Identifier = node.name;
      const indexBasedFunctionName = nodeName.value;
      const functionIndex = Number(indexBasedFunctionName.replace("func_", ""));
      signature.params.forEach((param, paramIndex) => {
        const paramName = localNames.find(
          (f) =>
            f.localIndex === paramIndex && f.functionIndex === functionIndex
        );
        if (paramName && paramName.name !== "") {
          param.id = paramName.name;
        }
      });
    },
  });
}

function restoreModuleName(ast) {
  t.traverse(ast, {
    ModuleNameMetadata(moduleNameMetadataPath: NodePath<ModuleNameMetadata>) {
      // update module
      t.traverse(ast, {
        Module({ node }: NodePath<Module>) {
          let name = moduleNameMetadataPath.node.value;

          // compatiblity with wast-parser
          if (name === "") {
            name = null;
          }

          node.id = name;
        },
      });
    },
  });
}

export function decode(buf: ArrayBuffer, customOpts: Object): Program {
  const opts: DecoderOpts = Object.assign({}, defaultDecoderOpts, customOpts);
  const ast = decoder.decode(buf, opts);

  if (opts.ignoreCustomNameSection === false) {
    restoreFunctionNames(ast);
    restoreLocalNames(ast);
    restoreModuleName(ast);
  }

  return ast;
}
