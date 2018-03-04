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
import { edit } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const visitors = {
  ModuleImport({ node }) {
    node.module = "foo";
    node.name = "bar";
  }
};

const newBinary = edit(binary, visitors);
```

Replace:

```js
import { edit } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const visitors = {
  Instr(path) {
    const newNode = t.callInstruction(t.indexLiteral(0));
    path.replaceWith(newNode);
  }
};

const newBinary = edit(binary, visitors);
```

Remove:

```js
import { edit } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const visitors = {
  ModuleExport({ node }) {
    path.remove()
  }
};

const newBinary = edit(binary, visitors);
```

Insert:

```js
import { add } from "@webassemblyjs/wasm-edit";

const binary = [/*...*/];

const newBinary = add(actualBinary, [
  t.moduleImport("env", "mem", t.memory(t.limits(1)))
]);
```
