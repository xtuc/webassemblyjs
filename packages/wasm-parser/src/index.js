// @flow
const t = require("@webassemblyjs/ast");
import * as decoder from "./decoder";

const defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false
};

// traverses the AST, locating function name metadata, which is then
// used to update index-based identifiers with function names
function restoreFunctionNames(ast) {
  const functionNames = [];

  t.traverse(ast, {
    FunctionNameMetadata({ node }) {
      functionNames.push({
        name: node.value,
        index: node.index
      });
    }
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
      const functionName = functionNames.find(f => f.index === index);
      if (functionName) {
        nodeName.value = functionName.name;

        // $FlowIgnore
        delete nodeName.raw;
      }
    },

    // Also update the reference in the export
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.type === "Func") {
        // $FlowIgnore
        const nodeName: Identifier = node.descr.id;
        const indexBasedFunctionName = nodeName.value;
        const index = Number(indexBasedFunctionName.replace("func_", ""));
        const functionName = functionNames.find(f => f.index === index);

        if (functionName) {
          nodeName.value = functionName.name;
        }
      }
    },

    CallInstruction(nodePath: NodePath<CallInstruction>) {
      const node = nodePath.node;
      const index = node.index.value;
      const functionName = functionNames.find(f => f.index === index);
      if (functionName) {
        node.index = t.identifier(functionName.name);

        // $FlowIgnore
        delete node.raw;
      }
    }
  });
}

function restoreLocalNames(ast) {
  const localNames = [];

  t.traverse(ast, {
    LocalNameMetadata({ node }) {
      localNames.push({
        name: node.value,
        localIndex: node.localIndex,
        functionIndex: node.functionIndex
      });
    }
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
          f => f.localIndex === paramIndex && f.functionIndex === functionIndex
        );
        if (paramName && paramName.name !== "") {
          param.id = paramName.name;
        }
      });
    }
  });
}

function restoreModuleName(ast) {
  t.traverse(ast, {
    ModuleNameMetadata(moduleNameMetadataPath: NodePath<ModuleNameMetadata>) {
      // update module
      t.traverse(ast, {
        Module({ node }: NodePath<Module>) {
          node.id = moduleNameMetadataPath.node.value;
        }
      });
    }
  });
}

export function decode(buf: ArrayBuffer, customOpts: Object): Program {
  const opts: DecoderOpts = Object.assign({}, defaultDecoderOpts, customOpts);
  const ast = decoder.decode(buf, opts);

  if (!opts.ignoreCustomNameSection) {
    restoreFunctionNames(ast);
    restoreLocalNames(ast);
    restoreModuleName(ast);
  }

  return ast;
}
