(function() {
  const input = document.getElementById("upload");
  const output = document.getElementById("output");
  const editor = document.getElementById("editor");
  const downloadBtn = document.getElementById("download");

  if (typeof webassemblyInterpreter === "undefined") {
    throw new Error("webassemblyInterpreter has not been loaded");
  }

  function downloadURL(data, fileName) {
    let a;
    a = document.createElement("a");
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    a.style = "display: none";
    a.click();
    a.remove();
  }

  function encodeInUrl(buff) {
    window.location.hash = new Uint8Array(buff).toString();
  }

  function decodeFromUrl() {
    if (window.location.hash === "") {
      return;
    }

    const byteArray = window.location.hash.split(",");

    const buff = new Uint8Array(byteArray);

    return buff.buffer;
  }

  function showOutput(out) {
    const lineCount = out.split("\n").length;
    const sizePerLine = 20;

    editor.style.height = lineCount * sizePerLine;

    output.innerHTML = '<code className="language-wast">' + out + "</code>";
  }

  function toWast(ast) {
    return webassemblyInterpreter.printers.printWAST(ast);
  }

  function parseBinary(buff) {
    try {
      return webassemblyInterpreter.parsers.parseWASM(buff);
    } catch (e) {
      showOutput("Error: " + e.message);
      throw e;
    }
  }

  input.addEventListener("change", function(event) {
    const file = event.target.files[0];

    const fileReader = new FileReader();

    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;

      encodeInUrl(arrayBuffer);

      const ast = parseBinary(arrayBuffer);
      const wastOut = toWast(ast);

      showOutput(wastOut);
    };

    fileReader.readAsArrayBuffer(file);
  });

  downloadBtn.addEventListener("click", function() {
    const savedBuffer = decodeFromUrl();

    if (typeof savedBuffer === "undefined") {
      throw new Error("No saved binary");
    }

    const blob = new Blob([new Uint8Array(savedBuffer)], {
      type: "application/wasm"
    });
    const objectUrl = URL.createObjectURL(blob);

    downloadURL(objectUrl, "module.wasm", "application/wasm");

    window.URL.revokeObjectURL(objectUrl);
  });

  const savedBuffer = decodeFromUrl();

  if (typeof savedBuffer !== "undefined") {
    const ast = parseBinary(savedBuffer);
    const wastOut = toWast(ast);

    showOutput(wastOut);
  }
})();
