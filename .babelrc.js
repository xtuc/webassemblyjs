const {parse} = require("babylon");
const generate = require("@babel/generator").default;

const parserOptions = {
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowSuperOutsideMethod: true
};

function hasFlag(name) {
  return process.env["WITH_" + name.toUpperCase()] === "1";
}

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
    const {name} = ident;

    if (t.isArrowFunctionExpression(fn) === false) {
      throw new Error("Unsupported macro");
    }

    if (name === "trace" && hasFlag("trace") === false) {
      return;
    }

    macroMap[name] = fn;
  }

  return {
    visitor: {
      CallExpression(path) {
        const {node} = path;

        if (t.isIdentifier(node.callee, {name: "MACRO"})) {
          defineMacro(node.arguments[0], node.arguments[1]);
          path.remove();

          return;
        }

        const macro = macroMap[node.callee.name];

        if (typeof macro !== "undefined") {
          const callExpressionArgs = node.arguments;

          const string = renderTemplate(macro.body, callExpressionArgs);
          const ast = parse(string, parserOptions).program.body;

          path.replaceWithMultiple(ast);
        }

        if (node.callee.name === "trace" && hasFlag("trace") === false) {
          path.remove();
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
