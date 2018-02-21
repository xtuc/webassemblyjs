# Roadmap

## Version 1.0.0

There are a few PRs against Webpack to use directly or indirectly this project.

It's important that the features used in Webpack are working, and thus the following work is priority:
- Making sure that we can parse WASM binaries
  - [ ] Ability to import memory (https://github.com/xtuc/js-webassembly-interpreter/issues/137)
  - [ ] Implement data sections
  - [ ] Implement custom sections
  - [ ] Add more invalid modules coverage from spec tests

## Version 1.1.0

The second important feature for Webpack is [wasm-dce](https://github.com/xtuc/wasm-dce).

It depends on webassembly-interpreter, and thus the following work is todo:
- Improve WASM support
  - [ ] WASM code generation (https://github.com/xtuc/js-webassembly-interpreter/issues/68)
  - [ ] Transform our current WAST test suite to WASM and relaunch the same tests.
