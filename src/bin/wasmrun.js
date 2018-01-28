#!/usr/bin/env node
// @flow

const { instantiate } = require("../index");
const fs = require("fs");

function debug(msg: string) {
  console.error(msg);
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];
const entrypoint = process.argv[3];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

debug("Compiling...");

// $FlowIgnore: this is correct but not correctly documented
const buff = toArrayBuffer(fs.readFileSync(filename, null));

const importObject = {
  env: {
    printf: function(...args) {
      console.log("printf", ...args);
    }
  }
};

instantiate(buff, importObject)
  .then(({ instance }) => {
    console.log("exports", Object.keys(instance.exports));

    if (typeof entrypoint !== "undefined") {
      const startfn = instance.exports[entrypoint];

      if (typeof startfn !== "function") {
        throw new Error("Entrypoint not found");
      }

      debug("Executing...");

      const exitCode = startfn(...process.argv.slice(4));
      console.log("exited with code", exitCode);
    }
  })
  .catch(err => {
    throw err;
  });
