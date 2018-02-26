const {parse} = require("babylon");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

function identEq(l, r) {
  return l.name === r.name;
}

function parseSource(source) {
  return parse(source, {
    sourceType: "module",

    plugins: [
      "jsx",
    ]
  });
}

/**
 * We found a local binding from the wasm binary.
 *
 * `import x from 'module.wasm'`
 *         ^
 */
function onLocalModuleBinding(ident, ast, acc) {

  traverse(ast, {

    CallExpression({node: callExpression}) {

      // left must be a member expression
      if (t.isMemberExpression(callExpression.callee) === false) {
        return;
      }

      const memberExpression = callExpression.callee;

      /**
       * Search for `makeX().then(...)`
       */
      if (
        t.isCallExpression(memberExpression.object)
        && memberExpression.object.callee.name === ident.name
        && memberExpression.property.name === "then"
      ) {
        const [thenFnBody] = callExpression.arguments;

        if (typeof thenFnBody === "undefined") {
          return;
        }

        onInstanceThenFn(thenFnBody, acc);
      }
    }

  });
}

/**
 * We found the function handling the module instance
 *
 * `makeX().then(...)`
 */
function onInstanceThenFn(fn, acc) {
  if (t.isArrowFunctionExpression(fn) === false) {
    throw new Error("Unsupported function type: " + fn.type);
  }

  let [localIdent] = fn.params;

  /**
   * `then(({exports}) => ...)`
   *
   * We need to resolve the identifier (binding) from the ObjectPattern.
   *
   * TODO(sven): handle renaming the binding here
   */
  if (t.isObjectPattern(localIdent) === true) {
    // ModuleInstance has the exports prop by spec
    localIdent = t.identifier('exports');
  }

  traverse(fn.body, {
    noScope: true,

    MemberExpression(path) {
      const {object, property} = path.node;

      /**
       * Search for `localIdent.exports`
       */
      if (
        identEq(object, localIdent) === true
        && t.isIdentifier(property, {name: 'exports'})
      ) {
        /**
         * We are looking for the right branch of the parent MemberExpression:
         * `(localIdent.exports).x`
         *                       ^
         */
        let {property} = path.parentPath.node;

        // Found an usage of an export
        acc.push(property.name);

        path.stop();
      }

      /**
       * `exports` might be a local binding (from destructuring)
       */
      else if (identEq(object, localIdent) === true) {
        // Found an usage of an export
        acc.push(property.name);

        path.stop();
      }
    }

  });
}

module.exports = function (source) {
  const usedExports = []
  const ast = parseSource(source);

  traverse(ast, {

    ImportDeclaration(path) {
      const [specifier] = path.node.specifiers;

      if (t.isImportDefaultSpecifier(specifier)) {
        onLocalModuleBinding(specifier.local, ast, usedExports);
        path.stop();
      }

    }
  });

  return usedExports;
};
