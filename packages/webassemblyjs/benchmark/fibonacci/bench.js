function test({
  WebAssembly,
  wasmbin,
  showHeader,
  performance,
  NBINTERATION,
  formatNumber,
  output,

  _random
}) {
  return WebAssembly.instantiate(wasmbin).then(m => {
    showHeader();

    const exports = m.instance.exports;

    const t0 = performance.now();

    console.log(exports.main(2));

    // for (let i = 0; i < NBINTERATION; i++) {
    //   const l = 10;

    //   exports.main(l);
    // }

    const t1 = performance.now();

    output("total " + formatNumber(t1 - t0));
    output("mean " + formatNumber((t1 - t0) / NBINTERATION));
  });
}

module.exports = { test };
