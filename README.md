# webassemblyjs

> Toolchain for WebAssembly

<img alt="npm Downloads" src="https://img.shields.io/npm/dm/@webassemblyjs/ast.svg?maxAge=43200">

See [WebAssembly.js.org](https://webassembly.js.org) for more information.

## Packages

- [ast](https://github.com/xtuc/webassemblyjs/tree/master/packages/ast) - AST utils for webassemblyjs
- [cli](https://github.com/xtuc/webassemblyjs/tree/master/packages/cli) - Toolbox for WebAssembly
- [dce](https://github.com/xtuc/webassemblyjs/tree/master/packages/dce) - Eliminate unused functions in your WASM binary
- [eslint-plugin-webassembly](https://github.com/xtuc/webassemblyjs/tree/master/packages/eslint) - ESLint plugin for WebAssembly.
- [floating-point-hex-parser](https://github.com/xtuc/webassemblyjs/tree/master/packages/floating-point-hex-parser) - Parser function for floating point hexadecimals.
- [helper-buffer](https://github.com/xtuc/webassemblyjs/tree/master/packages/helper-buffer) - Buffer manipulation helpers
- [helper-fsm](https://github.com/xtuc/webassemblyjs/tree/master/packages/helper-fsm) - FSM implementation
- [helper-wasm-bytecode](https://github.com/xtuc/webassemblyjs/tree/master/packages/helper-wasm-bytecode) - Constants for the wasm format
- [helper-wasm-section](https://github.com/xtuc/webassemblyjs/tree/master/packages/helper-wasm-section) - Section manipulation helpers
- [leb128](https://github.com/xtuc/webassemblyjs/tree/master/packages/leb128) - `LEB128` decoding
- [repl](https://github.com/xtuc/webassemblyjs/tree/master/packages/repl) - WebAssembly REPL.
- [validation](https://github.com/xtuc/webassemblyjs/tree/master/packages/validation) - Module AST validations
- [wasm-edit](https://github.com/xtuc/webassemblyjs/tree/master/packages/wasm-edit) - Replace in-place an AST node in the binary.
- [wasm-gen](https://github.com/xtuc/webassemblyjs/tree/master/packages/wasm-gen) - WebAssembly binary format printer
- [wasm-opt](https://github.com/xtuc/webassemblyjs/tree/master/packages/wasm-opt) - WASM optimizer
- [wasm-parser](https://github.com/xtuc/webassemblyjs/tree/master/packages/wasm-parser) - WebAssembly binary format parser
- [wasm-strip](https://github.com/xtuc/webassemblyjs/tree/master/packages/wasm-strip) - Strips custom sections
- [wast-loader](https://github.com/xtuc/webassemblyjs/tree/master/packages/wast-loader) - Webpack loader for WebAssembly text format
- [wast-parser](https://github.com/xtuc/webassemblyjs/tree/master/packages/wast-parser) - WebAssembly text format parser
- [wast-printer](https://github.com/xtuc/webassemblyjs/tree/master/packages/wast-printer) - WebAssembly text format printer
- [wast-refmt](https://github.com/xtuc/webassemblyjs/tree/master/packages/wast-refmt) - WAST refmt
- [webassemblyjs](https://github.com/xtuc/webassemblyjs/tree/master/packages/webassemblyjs) - WebAssembly interpreter, implements the W3C WebAssembly API.

## Node's Buffer

Some packages rely on Node's Buffer which isn't available in other environments.
We recommend you to add https://github.com/feross/buffer in your building process.

## Licence

[MIT](https://github.com/xtuc/webassemblyjs/blob/master/LICENSE)
