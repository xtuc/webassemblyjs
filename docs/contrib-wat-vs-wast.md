---
title: WAST vs WAT
id: contrib-wat-vs-wast
---

## `.wat`

First, WAT and WAT refers to the same format, it's officially part of the WebAssembly specification available [here](https://webassembly.github.io/spec/core/text/index.html).

It's basically a retranscription of the binary format in text, it closely follows the same semantics.

## `.wast`

WAST is a superset of the WebAssembly text format and not officially in the spec. You can find its grammar definition [here](https://github.com/WebAssembly/spec/tree/master/interpreter#s-expression-syntax).
It is used only for testing purposes, the reference implementation of WebAssembly uses this format for its test (mostly because it's easier to write by hand).

For the sake of simplicity I'm working on having the semantics of WAT and WAST as close as possible, we have various transformation [here](https://github.com/xtuc/webassemblyjs/tree/master/packages/ast/src/transform).
