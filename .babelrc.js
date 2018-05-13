const {parse} = require("babylon");
const generate = require("@babel/generator").default;

const parserOptions = {
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowSuperOutsideMethod: true
};

function macro({types: t}) {
  const macroMap = {};

  function renderTemplate(template, args) {
    args.reverse();

    return template.quasis.reduce((acc, el, index) => {
      acc += el.value.raw;

      const arg = args[index];

      if (typeof arg !== "undefined") {
        acc += generate(arg).code;
      } else {
        acc += "undefined";
      }

      return acc;
    }, '');
  }

  function defineMacro(ident, fn) {
    let content = '';

    if (t.isArrowFunctionExpression(fn) === false) {
      throw new Error("Unsupported macro");
    }

    macroMap[ident.name] = fn;
  }

  return {
    visitor: {
      CallExpression(path) {
        const {node} = path;

        if (t.isIdentifier(node.callee, {name: "MACRO"})) {
          defineMacro(node.arguments[0], node.arguments[1]);
          path.remove();
        }

        const macro = macroMap[node.callee.name];

        if (typeof macro !== "undefined") {
          const callExpressionArgs = node.arguments;

          const string = renderTemplate(macro.body, callExpressionArgs);
          const ast = parse(string, parserOptions).program.body;

          path.replaceWithMultiple(ast);
        }

      }
    }
  }
}

const presets = [
  '@babel/preset-env',
  '@babel/preset-flow',
];

const plugins = [
  '@babel/plugin-proposal-export-default-from',
  macro
];

module.exports = {
  presets,
  plugins,
}
