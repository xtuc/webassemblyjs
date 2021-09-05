const { traverse } = require("@webassemblyjs/ast");

const template = require("@babel/template").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const globalInstanceIdentifier = t.identifier("instance");
const globalMemoryIdentifier = t.identifier("_memory0");
const globalTableIdentifier = t.identifier("_table0");

const exportFuncTemplate = template.program(`
  export function NAME(ARGS) {
    if (typeof INSTANCE === "undefined") {
      throw new Error("Can not call function " + NAME.name + ", module not initialized.");
    }

    return INSTANCE.exports.NAME(ARGS);
  }
`);

const headerTemplate = template.program(`
  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly not supported");
  }

  let INSTANCE;

  const MEMORY = new WebAssembly.Memory({initial: 100, limit: 1000});
  const TABLE = new WebAssembly.Table({initial: 0, element: 'anyfunc'});
`);

const initFuncTemplate = template.program(`
  export const memory = MEMORY;
  export const table = TABLE;

  export default function(opts = {env:{}}) {

    if (typeof opts.env.memory === "undefined") {
      opts.env.memory = MEMORY;
    }

    if (typeof opts.env.table === "undefined") {
      opts.env.table = TABLE;
    }

    const importObject = opts;

    const getArrayBuffer = response => response.arrayBuffer();
    const instantiate = bytes => WebAssembly.instantiate(bytes, importObject);
    const getInstance = results => (instance = results.instance);

    return window.fetch(URL)
      .then(getArrayBuffer)
      .then(instantiate)
      .then(getInstance);
  }
`);

function genTemplate(fn, opts) {
  const ast = fn(opts);
  return generate(ast).code;
}

function printExport(moduleExport, funcsTable) {
  if (moduleExport.descr.exportType === "Func") {
    const funcNode = funcsTable[moduleExport.descr.id.value];

    const params = funcNode.params
      .map((x) => x.valtype)
      .map((x, k) => t.identifier("p" + k + "_" + x));

    return (
      genTemplate(exportFuncTemplate, {
        NAME: t.identifier(moduleExport.name),
        ARGS: params,
        INSTANCE: globalInstanceIdentifier,
      }) + "\n\n"
    );
  }

  return "";
}

function print(ast, { url }) {
  if (typeof url === "undefined") {
    throw new Error("You need to provide --url [url]");
  }

  let out = "";

  const state = {
    moduleExports: [],
    moduleImports: [],
    funcsTable: {},
  };

  traverse(ast, {
    Func({ node }) {
      state.funcsTable[node.name.value] = node;
    },

    ModuleExport({ node }) {
      state.moduleExports.push(node);
    },

    ModuleImport({ node }) {
      state.moduleImports.push(node);
    },
  });

  // Add comment
  out += "/**\n";
  out += " * Autogenered by wasmgen -o js.\n";
  out += " *\n";
  out += " * DO NOT EDIT.\n";
  out += " */\n";

  out += "\n";

  out += genTemplate(headerTemplate, {
    INSTANCE: globalInstanceIdentifier,
    MEMORY: globalMemoryIdentifier,
    TABLE: globalTableIdentifier,
  });

  out += "\n\n";

  out += genTemplate(initFuncTemplate, {
    URL: t.StringLiteral(url),
    MEMORY: globalMemoryIdentifier,
    TABLE: globalTableIdentifier,
  });

  out += "\n\n";

  if (state.moduleExports.length > 0) {
    out += state.moduleExports.reduce((acc, e) => {
      return acc + printExport(e, state.funcsTable);
    }, "");
  }

  return out;
}

module.exports = print;
