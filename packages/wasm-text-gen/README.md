# @webassemblyjs/wasm-text-gen

> Emit documentation/code for your WASM binary

## Installation

```sh
yarn add -g @webassemblyjs/wasm-text-gen
```

## Usage

```sh
wasmgen path/to/binary.wasm
```

### Printers

Text (default):

```sh
wasmgen -o text path/to/binary.wasm
```

Markdown:

```sh
wasmgen -o md path/to/binary.wasm

// or

wasmgen -o markdown path/to/binary.wasm
```

JavaScript:

```sh
wasmgen -o js --url http://xtuc.fr/foo.wasm path/to/binary.wasm

// or

wasmgen -o javascript --url http://xtuc.fr/foo.wasm path/to/binary.wasm
```
