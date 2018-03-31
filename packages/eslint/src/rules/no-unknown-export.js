import { traverse } from "@webassemblyjs/ast";
import { decode } from "@webassemblyjs/wasm-parser";
import path from "path";
import { existsSync, readFileSync } from "fs";
import { traverse as estraverse } from "estraverse";

const decoderOpts = {
  ignoreCodeSection: true,
  ignoreDataSection: true
};

function getExportsFromWasm(file) {
  const exports = [];

  const binary = readFileSync(file, null);
  const ast = decode(binary, decoderOpts);

  traverse(ast, {
    ModuleExport({ node }) {
      exports.push(node.name);
    }
  });

  return exports;
}

function getUsageIn(body, on) {
  const used = [];

  estraverse(body, {
    enter: function(node) {
      if (node.type === "MemberExpression") {
        const { object, property } = node;

        if (object.name === on) {
          used.push(property.name);
        }
      }
    }
  });

  return used;
}

module.exports = {
  create(context) {
    return {
      /**
       * `import(x).then(f)`
       */
      MemberExpression(node) {
        const { object, property } = node;

        if (object.type !== "CallExpression") {
          return;
        }

        if (object.callee.type !== "Import") {
          return;
        }

        if (property.name !== "then") {
          return;
        }

        const dirname = path.dirname(context.getFilename());

        const source = object.arguments[0].value;
        const file = path.join(dirname, source);

        if (existsSync(file) === false) {
          return context.report({
            node: object,
            message: JSON.stringify(file) + " is not a valid WASM file"
          });
        }

        const exports = getExportsFromWasm(file);

        // get binding in `then(x)`
        const [fn] = node.parent.arguments;
        const [binding] = fn.params;

        let used = [];

        if (binding.type === "Identifier") {
          used = getUsageIn(fn.body, binding.name);
        }

        if (binding.type === "ObjectPattern") {
          used = binding.properties.map(prop => prop.value.name);
        }

        used.forEach(name => {
          const exportExists = exports.indexOf(name) !== -1;

          if (exportExists === false) {
            context.report({
              node,
              message: JSON.stringify(name) + " is not exported"
            });
          }
        });
      }
    };
  }
};
