#!/usr/bin/env node
// @flow

const {instantiate} = require('../index');
const fs = require('fs');

function debug(msg: string) {
  console.error(msg);
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
}

const filename = process.argv[2];
const entrypoint = process.argv[3];

if (typeof filename === 'undefined') {
  throw new Error('Missing file');
}

debug('Compiling...');

const buff = toArrayBuffer(fs.readFileSync(filename, null));

const importObject = {

  imports: {
    printf: function(...args) {
      console.log(...args);
    }
  }

};

instantiate(buff, importObject)
  .then((module) => {

    if (typeof entrypoint !== 'undefined') {
      const startfn = module.exports[entrypoint];

      if (typeof startfn !== 'function') {
        throw new Error('Entrypoint not found');
      }

      debug('Executing...');

      const exitCode = startfn(...process.argv.slice(4));
      console.log('exited with code', exitCode);
    }

  })
  .catch((err) => {
    throw err;
  });
