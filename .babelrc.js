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

function joinAndRenderTemplate(template) {
  return template.quasis.reduce((acc, el) => {
    acc += el.value.raw;

    const expr = template.expressions.shift();

    if (typeof expr !== "undefined") {
      acc += generate(expr).code;
    }

    return acc;
  }, '');
}

function replaceTempateExpressionWith(template, search, remplacement) {
  template.expressions = template.expressions.reduce((acc, expr) => {

    if (expr.name === search) {
      acc.push(remplacement);
    } else {
      acc.push(expr);
    }

    return acc;
  }, []);
}

function macro({types: t}) {
  const macroMap = {};

  function renderMacro(originalMacro, args) {
    // args.reverse();
    const macro = t.cloneDeep(originalMacro);

    const templateParams = macro.params;
    const template = macro.body;

    // replace in template
    templateParams.forEach((templateArg, index) => {
      const calledWithArg = args[index];

      let remplacement = calledWithArg;

      if (typeof calledWithArg === "undefined") {
        remplacement = t.identifier("undefined");
      }

      replaceTempateExpressionWith(template, templateArg.name, remplacement);
    });

    // render
    return joinAndRenderTemplate(template);
  }

  function defineMacro(ident, fn) {
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
      CallExpression(path, state) {
        const {node} = path;

        /**
         * Register macro
         */
        if (t.isIdentifier(node.callee, {name: "MACRO"})) {
          defineMacro(node.arguments[0], node.arguments[1]);
          path.remove();

          return;
        }

        /**
         * Process macro
         */
        const macro = macroMap[node.callee.name];

        if (typeof macro !== "undefined") {
          const callExpressionArgs = node.arguments;

          const string = renderMacro(macro, callExpressionArgs);
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
