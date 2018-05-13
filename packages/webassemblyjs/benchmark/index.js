const { readFileSync, writeFileSync } = require("fs");
const glob = require("glob");
const { join, dirname } = require("path");
const now = require("performance-now");
const wabt = require("wabt");

const interpreter = require("../lib");
const interpreterpkg = require("../package.json");

const basePath = join(__dirname, "..");

if (typeof WebAssembly === "undefined") {
  console.log("WebAssembly not supported, skiping.");
  process.exit(0);
}

const benchmarks = glob.sync(join(basePath, "benchmark/**/module.wast"));

function wastToWasm(content) {
  const module = wabt.parseWat("module.wast", content);
  const { buffer } = module.toBinary({ write_debug_names: true });

  return buffer.buffer;
}

function createRNG(nbr) {
  const numbers = [1, 2, 3, 4, 4, 5, 6, 7, 8, 9];
  const entropy = [];

  for (let i = 0; i < nbr; i++) {
    const v = numbers[Math.floor(Math.random() * numbers.length)];
    entropy.push(v);
  }

  return function get() {
    if (entropy.length === 0) {
      throw new Error("Entropy exhausted");
    }

    return entropy.pop();
  };
}

function formatNumber(i) {
  let unit = "ms";

  if (i < 1) {
    i *= Math.pow(10, 6);
    unit = "ns";
  }

  return `${i.toFixed(10)} ${unit}`;
}

function writeResult(dir, result) {
  const resultFile = join(dir, "results");
  writeFileSync(resultFile, result);

  console.log("wrote result file", resultFile);
}

benchmarks.forEach(file => {
  let outputBuffer = "";

  function createShowHeader(mode) {
    return function() {
      output("");
      output("Testing " + mode);
    };
  }

  function output(msg) {
    outputBuffer += msg + "\n";
    process.stdout.write(msg + "\n");
  }

  function clearOuputBuffer() {
    outputBuffer = "";
  }

  const wast = readFileSync(file, "utf8");
  const wasmbin = wastToWasm(wast);

  const bench = require(join(dirname(file), "bench.js"));

  const NBINTERATION = Math.pow(10, 7);

  const sandbox = {
    wasmbin,
    output,
    performance: { now },
    NBINTERATION,
    formatNumber
  };

  // Run native
  const nativeSandbox = Object.assign({}, sandbox, {
    WebAssembly: global.WebAssembly,
    showHeader: createShowHeader("native"),
    random: createRNG(NBINTERATION * 2)
  });

  // Run interpreted
  const interpretedSandbox = Object.assign({}, sandbox, {
    showHeader: createShowHeader("interpreted"),
    WebAssembly: interpreter,
    random: createRNG(NBINTERATION * 2)
  });

  Promise.all([bench.test(nativeSandbox), bench.test(interpretedSandbox)])
    .then(() => {
      output("");
      output("Interations: " + NBINTERATION);
      output("Date: " + new Date().toLocaleDateString());
      output("V8 version: " + process.versions.v8);
      output("Interpreter version: " + interpreterpkg.version);

      // Write results
      writeResult(dirname(file), outputBuffer);

      clearOuputBuffer();
    })
    .catch(err => {
      console.log(outputBuffer);
      console.error(err);
    });
});
