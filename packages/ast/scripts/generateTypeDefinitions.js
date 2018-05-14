const definitions = require("../src/definitions");
const flatMap = require("array.prototype.flatmap");
const { typeSignature, mapProps, iterateProps } = require("./util");

const stdout = process.stdout;

const unique = items => Array.from(new Set(items));

function params(fields) {
  return mapProps(fields)
    .map(typeSignature)
    .join(",");
}

function generate() {
  stdout.write(`
    // @flow
    /* eslint no-unused-vars: off */
    
  `);

  // generate the union Node type
  stdout.write(`type Node = ${Object.keys(definitions).join("|")}\n\n`);

  // generate other union types
  const unionTypes = unique(
    flatMap(mapProps(definitions).filter(d => d.unionType), d => d.unionType)
  );
  unionTypes.forEach(unionType => {
    stdout.write(
      `type ${unionType} = ` +
        mapProps(definitions)
          .filter(d => d.unionType && d.unionType.includes(unionType))
          .map(d => d.name)
          .join("|") +
        ";\n\n"
    );
  });

  // generate the type definitions
  iterateProps(definitions, typeDef => {
    stdout.write(`type ${typeDef.flowTypeName || typeDef.name} = {
        ...${typeDef.extends || "BaseNode"},
        type: "${typeDef.astTypeName || typeDef.name}",
        ${params(typeDef.fields)}
      };\n\n`);
  });
}

generate();
