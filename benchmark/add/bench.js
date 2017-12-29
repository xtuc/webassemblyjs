function test({
  WebAssembly,
  wasmbin,
  showHeader,
  performance,
  NBINTERATION,
  formatNumber,
  output,
}) {

  return WebAssembly
    .instantiate(wasmbin)
    .then((m) => {
      showHeader();

      const exports = m.instance.exports;

      const t0 = performance.now();

      for (let i = 0; i < NBINTERATION; i++) {
        const l = Math.random() * 10 | 0;
        const r = Math.random() * 10 | 0;

        exports.add(l, r);
      }

      const t1 = performance.now();

      output('sandbox');
      output('total ' + formatNumber(t1 - t0));
      output('mean ' + formatNumber((t1 - t0) / NBINTERATION));
    });
}

module.exports = {test};
