/* global _webassemblyjs_repl, importScripts */

importScripts("https://bundle.run/@webassemblyjs/repl@1.2.4");

if (typeof _webassemblyjs_repl === "undefined") {
  throw new Error("REPL has not been loaded");
}

const { createRepl } = _webassemblyjs_repl;

const isVerbose = false;

function onAssert() {}

function onOk() {}

function onLog(txt) {
  postMessage(txt);
}

const repl = createRepl({ isVerbose, onAssert, onLog, onOk });

onmessage = function(e) {
  const code = e.data;
  code.split("\n").forEach(repl.read);
};
