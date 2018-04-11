const template = require("@babel/template").default;

function macro({types: t}) {
  const macroMap = {};

  function defineMacro(ident, body) {
    macroMap[ident.name] = template(body.value);
  }

  return {
    visitor: {
      CallExpression(path) {
        const {node} = path;

        if (t.isIdentifier(node.callee, {name: "MACRO"})) {
          defineMacro(...node.arguments);

          path.remove();
        }

        const macro = macroMap[node.callee.name];

        if (typeof macro !== "undefined") {

          if (node.arguments.length > 0) {
            const {properties} = node.arguments[0];

            const remplacements = properties.reduce((acc, prop) => {
              const {key, value} = prop;

              acc[key.name] = value;

              return acc;
            }, {});

            path.replaceWith(macro(remplacements));
          } else {
            path.replaceWith(macro());
          }
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
