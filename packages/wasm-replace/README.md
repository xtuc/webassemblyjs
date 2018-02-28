# @webassemblyjs/wasm-replace

> Rewrite a WASM binary

Replace in-place an AST node in the binary.

## Installation

```sh
npm install @webassemblyjs/wasm-replace
```

## Usage

```js
import { replaceInBinary } from "@webassemblyjs/wasm-replace";

const binary = [/*...*/];

const visitors = {
  ModuleImport({ node }) {
    node.module = "foo";
    node.name = "bar";
  }
};

const newBinary = replaceInBinary(binary, visitors);
```
