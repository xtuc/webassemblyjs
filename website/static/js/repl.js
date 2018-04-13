/* global monaco */
"use strict";

const TIMEOUT_IN_SEC = 30;

let timeoutHandler;

const REGEXP_NUMBER = /[+\-]?(?:nan(?::0x[0-9a-fA-F]+)?|infinity|inf|0x[0-9a-fA-F]+\.?[0-9a-fA-F]*p[+\/-]?\d+|\d+(?:\.\d*)?[eE][+\-]?\d*|\d+\.\d*|0x[0-9a-fA-F]+|\d+)/;

const REGEXP_KEYWORD = /anyfunc|mut|nop|block|if|then|else|loop|br|br_if|br_table|call|call_indirect|drop|end|return|get_local|set_local|tee_local|get_global|set_global|i32\.load|i64\.load|f32\.load|f64\.load|i32\.store|i64\.store|f32\.store|f64\.store|i32\.load8_s|i64\.load8_s|i32\.load8_u|i64\.load8_u|i32\.load16_s|i64\.load16_s|i32\.load16_u|i64\.load16_u|i64\.load32_s|i64\.load32_u|i32\.store8|i64\.store8|i32\.store16|i64\.store16|i32\.const|i64\.const|f32\.const|f64\.const|i32\.eqz|i64\.eqz|i32\.clz|i64\.clz|i32\.ctz|i64\.ctz|i32\.popcnt|i64\.popcnt|f32\.neg|f64\.neg|f32\.abs|f64\.abs|f32\.sqrt|f64\.sqrt|f32\.ceil|f64\.ceil|f32\.floor|f64\.floor|f32\.trunc|f64\.trunc|f32\.nearest|f64\.nearest|i32\.add|i64\.add|i32\.sub|i64\.sub|i32\.mul|i64\.mul|i32\.div_s|i64\.div_s|i32\.div_u|i64\.div_u|i32\.rem_s|i64\.rem_s|i32\.rem_u|i64\.rem_u|i32\.and|i64\.and|i32\.or|i64\.or|i32\.xor|i64\.xor|i32\.shl|i64\.shl|i32\.shr_s|i64\.shr_s|i32\.shr_u|i64\.shr_u|i32\.rotl|i64\.rotl|i32\.rotr|i64\.rotr|f32\.add|f64\.add|f32\.sub|f64\.sub|f32\.mul|f64\.mul|f32\.div|f64\.div|f32\.min|f64\.min|f32\.max|f64\.max|f32\.copysign|f64\.copysign|i32\.eq|i64\.eq|i32\.ne|i64\.ne|i32\.lt_s|i64\.lt_s|i32\.lt_u|i64\.lt_u|i32\.le_s|i64\.le_s|i32\.le_u|i64\.le_u|i32\.gt_s|i64\.gt_s|i32\.gt_u|i64\.gt_u|i32\.ge_s|i64\.ge_s|i32\.ge_u|i64\.ge_u|f32\.eq|f64\.eq|f32\.ne|f64\.ne|f32\.lt|f64\.lt|f32\.le|f64\.le|f32\.gt|f64\.gt|f32\.ge|f64\.ge|i64\.extend_s\/i32|i64\.extend_u\/i32|i32\.wrap\/i64|i32\.trunc_s\/f32|i64\.trunc_s\/f32|i32\.trunc_s\/f64|i64\.trunc_s\/f64|i32\.trunc_u\/f32|i64\.trunc_u\/f32|i32\.trunc_u\/f64|i64\.trunc_u\/f64|f32\.convert_s\/i32|f64\.convert_s\/i32|f32\.convert_s\/i64|f64\.convert_s\/i64|f32\.convert_u\/i32|f64\.convert_u\/i32|f32\.convert_u\/i64|f64\.convert_u\/i64|f64\.promote\/f32|f32\.demote\/f64|f32\.reinterpret\/i32|i32\.reinterpret\/f32|f64\.reinterpret\/i64|i64\.reinterpret\/f64|select|unreachable|current_memory|grow_memory|type|func|param|result|local|global|module|table|memory|start|elem|data|offset|import|export|i32|i64|f32|f64/;

const REGEXP_KEYWORD_ASSERTS = /assert_invalid|assert_return|invoke|assert_trap|assert_malformed|assert_unlinkable/;

const REGEXP_STRING = /"(?:[^"\\\x00-\x1f\x7f]|\\[nt\\'"]|\\[0-9a-fA-F][0-9a-fA-F])*"/;

/**
 * Monaco wast def
 */

function configureMonaco() {
  monaco.languages.register({ id: "wast" });

  monaco.languages.setMonarchTokensProvider("wast", {
    tokenizer: {
      root: [
        [REGEXP_KEYWORD, "keyword"],
        [REGEXP_KEYWORD_ASSERTS, "keyword"],
        [REGEXP_NUMBER, "number"],
        [/\$([a-zA-Z0-9_`\+\-\*\/\\\^~=<>!\?@#$%&|:\.]+)/, "variable-2"],
        [REGEXP_STRING, "string"],
        [/;;.*$/, "comment"]
      ]
    }
  });

  monaco.editor.defineTheme("wastTheme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string", foreground: "4caf50" },
      { token: "number", foreground: "808080" }
    ]
  });
}

const defaultCode = `(module
  (func (export "get") (result i32)
    (i32.const 1)
  )
)`;

let lastCode = defaultCode;

/**
 * Worker
 */

if (!window.Worker) {
  throw new Error("Unsupported environment");
}

const w = new Worker("/js/repl-worker.js");

/**
 * Worker
 */

function main() {
  configureMonaco();

  const output = document.getElementById("output");

  w.onmessage = function(e) {
    const txt = e.data;
    output.innerText = txt;

    clearTimeout(timeoutHandler);
  };

  const editor = monaco.editor.create(document.getElementById("container"), {
    value: defaultCode,
    language: "wast",
    theme: "wastTheme"
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
    output.innerText = ""; // clear ouput before next iteration

    w.postMessage(code);

    // Check after some time if we got the response
    timeoutHandler = setTimeout(() => {
      w.terminate();

      output.innerText = `
        Execution timing out and the worker has been killed.
        Please reload the page.
      `;
    }, TIMEOUT_IN_SEC * 1000);
  }

  exec(defaultCode);
}

window.addEventListener("load", main);
