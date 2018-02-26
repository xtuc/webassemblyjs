# @webassembly/ast

> AST utils for webassemblyjs

## Installation

```sh
npm install @webassemblyjs/ast
```

## Usage

### Traverse

```js
import { traverse } from "@webassemblyjs/ast";

traverse(ast, {
  Module(path) {
    console.log(path.node);
  }
});
```

### AST Nodes

Coming soon.
