const template = require("@babel/template").default;
const parseAndBuildMetadata = require("@babel/template/lib/parse").default;
const smartFormater = require("@babel/template/lib/formatters").smart;

function macro({types: t}) {
  const macroMap = {};

  function defineMacro(ident, body) {
    let content = '';

    if (t.isStringLiteral(body)) {
      content = body.value;
    }

    // Just merge elements
    if (t.isTemplateLiteral(body)) {
      content = body.quasis.reduce((acc, e) => {
        acc += e.value.raw;
        return acc;
      }, '');
    }

    const {placeholderNames} = parseAndBuildMetadata(smartFormater, content, {});

    macroMap[ident.name] = {
      run: template.smart(content),
      placeholderNames,
    }
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

            const defaultRemplacements = {};

            for (let entry of macro.placeholderNames.entries()) {
              defaultRemplacements[entry[0]] = t.identifier("undefined");
            }

            const remplacements = properties.reduce((acc, prop) => {
              const {key, value} = prop;

              acc[key.name] = value;

              return acc;
            }, defaultRemplacements);

            path.replaceWith(macro.run(remplacements));
          } else {
            path.replaceWith(macro.run());
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
