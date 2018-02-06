function formatNumber(i) {
  let unit = "ms";

  if (i < 1) {
    i *= Math.pow(10, 6);
    unit = "ns";
  }

  return `${i.toFixed(10)} ${unit}`;
}

const NBINTERATION = Math.pow(10, 6);

request = new XMLHttpRequest();
request.open("GET", "/example-add.wasm");
request.responseType = "arraybuffer";
request.send();

request.onload = function() {
  const bytes = request.response;

  webassemblyInterpreter.instantiate(bytes).then(m => {
    const exports = m.instance.exports;

    const t0 = performance.now();

    for (let i = 0; i < NBINTERATION; i++) {
      const l = (Math.random() * 10) | 0;
      const r = (Math.random() * 10) | 0;

      exports.add(l, r);
    }

    const t1 = performance.now();
    console.log("interpreted");
    console.log("total " + formatNumber(t1 - t0));
    console.log("mean " + formatNumber((t1 - t0) / NBINTERATION));
  });

  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly not supported, skiping.");
  }

  WebAssembly.instantiate(bytes).then(m => {
    const exports = m.instance.exports;

    const t0 = performance.now();

    for (let i = 0; i < NBINTERATION; i++) {
      const l = (Math.random() * 10) | 0;
      const r = (Math.random() * 10) | 0;

      exports.add(l, r);
    }

    const t1 = performance.now();
    console.log("native");
    console.log("total " + formatNumber(t1 - t0));
    console.log("mean " + formatNumber((t1 - t0) / NBINTERATION));
  });
};
