"use strict";

if (typeof _webassemblyjs_repl === "undefined") {
  throw new Error("REPL has not been loaded");
}

const { createRepl } = _webassemblyjs_repl;

const isVerbose = true;
const onAssert = console.log;

const repl = createRepl({ isVerbose, onAssert });

const input = document.getElementById("value");
const exec = document.getElementById("exec");

document.getElementById("input").addEventListener("submit", onSubmit);

function onSubmit(e) {
  e.preventDefault();

  exec.innerText += input.value + "\n";

  repl.read(input.value);

  input.value = "";
}
