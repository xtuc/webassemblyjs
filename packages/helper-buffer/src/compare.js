// this are dev dependencies
const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");
const { decode } = require("@webassemblyjs/wasm-parser");

const oldConsoleLog = console.log;

export function compareArrayBuffers(l, r) {
  /**
   * Decode left
   */
  let bufferL = "";

  console.log = (...texts) => (bufferL += texts.join("") + "\n");

  try {
    decode(l, { dump: true });
  } catch (e) {
    console.error(bufferL);
    console.error(e);
    throw e;
  }

  /**
   * Decode right
   */
  let bufferR = "";

  console.log = (...texts) => (bufferR += texts.join("") + "\n");

  try {
    decode(r, { dump: true });
  } catch (e) {
    console.error(bufferR);
    console.error(e);
    throw e;
  }

  console.log = oldConsoleLog;

  const out = diff(bufferL, bufferR);

  if (out !== null && out !== NO_DIFF_MESSAGE) {
    throw new Error("\n" + out);
  }
}
