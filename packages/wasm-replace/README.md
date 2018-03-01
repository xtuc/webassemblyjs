# @webassemblyjs/wasm-replace

> Rewrite a WASM binary

Replace in-place an AST node in the binary.

## Installation

```sh
npm install @webassemblyjs/wasm-replace
```

## Usage

Update:
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

Remove:
```js
import { replaceInBinary } from "@webassemblyjs/wasm-replace";

const binary = [/*...*/];

const visitors = {
  ModuleExport({ node }) {
    path.remove()
  }
};

const newBinary = replaceInBinary(binary, visitors);
```
