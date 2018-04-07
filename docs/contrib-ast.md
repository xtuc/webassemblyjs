
---
title: AST Design
id: contrib-ast
---

The AST is our internal representation of WebAssembly modules within the project. It is produced / consumed by the parsers / printers that handle the binary WASM and textual WAST formats:

```
WASM  → wasm-parser ↘     ↗ wasm-gen     → WASM
                      AST
WAST  → wast-parser ↗     ↘ wast-printer → WAST

```

The structure of this AST is enforced via flow typing, and the `@webassemblyjs/ast` package that provides factory method for constructing AST nodes of the correct shape.

There are some significant differences between the WebAssembly specification for [binary format](https://webassembly.github.io/spec/core/binary/index.html) and [text format](https://webassembly.github.io/spec/core/text/index.html#) representation of modules that have an impact on the AST:
 - WASM doesn't have to include function and label names. This information may be supplied as a custom name section.
 - WAST representation has some redundancy, function signatures can be specified 'inline', whereas with WASM function signatures are represented in a section and referenced by index.

A design goal of our AST and the associated parsers / printers is that semantically equivalent WASM and WAST files should result in an identical AST representation. This results in a simpler interpreter that does not need to handle various AST representations of the same 'application'.

There are some exceptions to this rule ...

With WAST it is possible to have multiple representations of the same value, e.g. a constant value of `10000` is the same as `10_000`. In order to preserve this information, certain AST nodes have a `raw` property.