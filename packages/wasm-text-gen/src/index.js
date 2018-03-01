const { decode } = require("@webassemblyjs/wasm-parser");

const printText = require("./printers/text");
const printMarkdown = require("./printers/markdown");
const printJavaScript = require("./printers/javascript");

module.exports = function(buff, { out, url }) {
  const ast = decode(buff);

  switch (out) {
    case "text":
      return printText(ast);

    case "md":
    case "markdown":
      return printMarkdown(ast);

    case "js":
    case "javascript":
      return printJavaScript(ast, { url });

    default:
      throw new Error("Unsupported output: " + out);
  }
};
