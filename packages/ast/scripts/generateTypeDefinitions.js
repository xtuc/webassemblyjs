const fs = require("fs");
const prettier = require("prettier");
const definitions = require("../src/definitions");
const flatMap = require("array.prototype.flatmap");
const { typeSignature, mapProps, iterateProps } = require("./util");

const unique = items => Array.from(new Set(items));

function params(fields) {
  return mapProps(fields)
    .map(typeSignature)
    .join(",");
}

function generate() {
  const filename = "./src/types.js";

  let code = `
    // @flow
    /* eslint no-unused-vars: off */
    
  `;

  // generate the union Node type
  code += `type Node = ${Object.keys(definitions).join("|")} \n`;

  // generate other union types
  const unionTypes = unique(
    flatMap(mapProps(definitions).filter(d => d.unionType), d => d.unionType)
  );
  unionTypes.map(unionType => {
    code +=
      `\n\ntype ${unionType} = ` +
      mapProps(definitions)
        .filter(d => d.unionType && d.unionType.includes(unionType))
        .map(d => d.name)
        .join("|");
  });

  // generate the type definitions
  iterateProps(definitions, typeDef => {
    code += `
      type ${typeDef.flowTypeName || typeDef.name} = {
        ...${typeDef.extends || "BaseNode"},
        type: "${typeDef.astTypeName || typeDef.name}",
        ${params(typeDef.fields)}
      };
    `;
  });

  fs.writeFileSync(filename, prettier.format(code));
}

generate();
