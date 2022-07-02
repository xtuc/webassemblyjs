# @webassemblyjs/cli

> Toolbox for WebAssembly

## Installation

```sh
yarn add @webassemblyjs/cli
```

## Usage

### `wasm2wast`

```sh
wasm2wast module.wasm
```

Options:

| name | description |
|------|-------------|
| `--no-name-resolution` | disable name resolution |
| `--ignore-code-section` | don't print the code |


### `wasmdump`

```sh
wasmdump module.wasm
```

Options:

| name | description |
|------|-------------|
| `--ignore-code-section` | don't print the code |
| `--error-on-unknown-section` | error on unknown section |
