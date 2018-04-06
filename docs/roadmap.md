# Roadmap

There are a few PRs against Webpack to use directly or indirectly this project:
- https://github.com/webpack/webpack/pull/6533
- https://github.com/webpack/webpack/pull/6531
- https://github.com/ballercat/wasm-loader/pull/7

## Version 1.0.0

It's important that the features used in Webpack are working, and thus the following work is priority:
- Making sure that we can decode WASM binaries
  - [x] Ability to import memory (https://github.com/xtuc/webassemblyjs/issues/137)
  - [x] Ability to import table (https://github.com/xtuc/webassemblyjs/issues/171)
  - [x] Decode data and custom sections, we can skip them for now (https://github.com/xtuc/webassemblyjs/pull/185)
  - [ ] Add more invalid modules coverage from spec tests
  - [x] Decode the start section (https://github.com/xtuc/webassemblyjs/pull/164)
    - [x] WAST - Start the execution from the start function
- [x] Use a monorepo (https://github.com/xtuc/webassemblyjs/issues/166)
- [x] Rename WATF to WAT (https://github.com/xtuc/webassemblyjs/issues/152)
    
## Version 1.1.0

The second important feature for Webpack is [wasm-dce](https://github.com/xtuc/wasm-dce).

It depends on webassemblyjs, and thus the following work is todo:
- Improve WASM support
  - [ ] WASM code generation (https://github.com/xtuc/webassemblyjs/issues/68)
  - [ ] Use our existing WAT and interpreter tests against our WASM implementation.
