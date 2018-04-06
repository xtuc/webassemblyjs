"use strict";

if (typeof _webassemblyjs_repl === "undefined") {
  throw new Error("REPL has not been loaded");
}

const { createRepl } = _webassemblyjs_repl;

const isVerbose = true;
const onAssert = console.log;

const repl = createRepl({ isVerbose, onAssert });

const input = document.getElementById("value");
document.getElementById("input").addEventListener("submit", onSubmit);

function onSubmit(e) {
  e.preventDefault();

  repl.read(input.value);

  input.value = "";
}
