# @webassemblyjs/wasm-edit

> Rewrite a WASM binary

Replace in-place an AST node in the binary.

## Installation

```sh
npm install @webassemblyjs/wasm-edit
```

## Usage

Update:

```js
import { replaceInBinary } from "@webassemblyjs/wasm-edit";

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
import { replaceInBinary } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const visitors = {
  ModuleExport({ node }) {
    path.remove()
  }
};

const newBinary = replaceInBinary(binary, visitors);
```

Insert:

```js
import { addInBinary } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const newBinary = addInBinary(actualBinary, [
  t.moduleImport("env", "mem", t.memory(t.limits(1)))
]);
```
