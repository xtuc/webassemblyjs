// this are dev dependencies
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { decode } = require("@webassemblyjs/wasm-parser");

export function compareArrayBuffers(l, r) {
  const oldConsoleLog = console.log;

  /**
   * Decode left
   */
  let bufferL = "";

  console.log = (...texts) => (bufferL += texts.join("") + "\n");
  decode(l, { dump: true });

  /**
   * Decode right
   */
  let bufferR = "";

  console.log = (...texts) => (bufferR += texts.join("") + "\n");
  decode(r, { dump: true });

  console.log = oldConsoleLog;

  const out = diff(bufferL, bufferR);

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }
}
