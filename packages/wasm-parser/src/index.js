// @flow
import { traverse } from "@webassemblyjs/ast";
import * as decoder from "./decoder";

const defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false
};

function restoreNames(ast) {
  const functionNames = [];

  traverse(ast, {
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

  traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // $FlowIgnore
      const nodeName: Identifier = node.name;
      const indexBasedFunctionName = nodeName.value;
      const index = Number(indexBasedFunctionName.replace("func_", ""));
      const functionName = functionNames.find(f => f.index === index);
      if (functionName) {
        nodeName.value = functionName.name;
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
