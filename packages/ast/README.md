# @webassemblyjs/ast

> AST utils for webassemblyjs

## Installation

```sh
yarn add @webassemblyjs/ast
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

### Instruction signatures

```js
import { signatures } from "@webassemblyjs/ast";

console.log(signatures);
```

### AST Nodes

- function `signature(object, name)`
- function `identifier(value)`
- function `valtype(name)`
- function `stringLiteral(value)`
- function `program(body)`
- function `module(id, fields)`
- function `binaryModule(id, blob)`
- function `quoteModule(id, string)`
- function `moduleExport(name, type, id)`
- function `func(name, params, result, body)`
- function `objectInstruction(id, object, args, namedArgs)`
- function `instruction(id, args, namedArgs)`
- function `loopInstruction(label, resulttype, instr)`
- function `blockInstruction(label, instr, result)`
- function `numberLiteral(rawValue, instructionType)`
- function `callInstruction(index, instrArgs)`
- function `ifInstruction(testLabel, result, test, consequent, alternate)`
- function `withLoc(n, end, start)`
- function `moduleImport(module, name, descr)`
- function `globalImportDescr(valtype, mutability)`
- function `funcParam(valtype, id)`
- function `funcImportDescr(id, params, results)`
- function `table(elementType, limits, name, elements)`
- function `limits(min, max)`
- function `memory(limits, id)`
- function `data(memoryIndex, offset, init)`
- function `global(globalType, init, name)`
- function `globalType(valtype, mutability)`
- function `byteArray(values)`
- function `leadingComment(value)`
- function `blockComment(value)`
- function `indexLiteral(value)`
- function `memIndexLiteral(value)`
- function `typeInstructionFunc(params, result, id)`
- function `callIndirectInstruction(params, results, intrs)`
- function `start(index)`
- function `elem(table, offset, funcs)`
