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
function restoreNames(ast) {
  const functionNames = [];

  t.traverse(ast, {
    FunctionNameMetadata({ node }) {
      functionNames.push({
        name: node.value,
        index: node.index
      });
    }
  });

  if (!functionNames.length) {
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

export function decode(buf: ArrayBuffer, customOpts: Object): Program {
  const opts: DecoderOpts = Object.assign({}, defaultDecoderOpts, customOpts);
  const ast = decoder.decode(buf, opts);

  if (!opts.ignoreCustomNameSection) {
    restoreNames(ast);
  }

  return ast;
}
