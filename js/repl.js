/* global _webassemblyjs_repl, monaco */
"use strict";

const defaultCode = `(module
  (func (export "get") (result i32)
    (i32.const 1)
  )
)

(assert_return (invoke "get") (i32.const 42))`;

let lastCode = defaultCode;

function main() {
  if (typeof _webassemblyjs_repl === "undefined") {
    throw new Error("REPL has not been loaded");
  }

  const { createRepl } = _webassemblyjs_repl;

  const output = document.getElementById("output");

  const isVerbose = true;

  function onAssert() {}
  function onOk() {}

  function onLog(txt) {
    output.innerText = txt + "\n\n" + output.innerText;
  }

  const repl = createRepl({ isVerbose, onAssert, onLog, onOk });

  const editor = monaco.editor.create(document.getElementById("container"), {
    value: defaultCode
  });

  editor.focus();

  editor.onKeyUp(e => {
    const value = editor.getValue();

    if (e.ctrlKey === true && e.keyCode === 3 /* enter */) {
      setTimeout(() => exec(value), 1);
      e.stopPropagation();
    }

    if (value !== lastCode) {
      setTimeout(() => exec(value), 1);

      lastCode = value;
    }
  });

  function exec(code) {
    code.split("\n").forEach(repl.read);
  }

  exec(defaultCode);
}

window.addEventListener("load", main);
