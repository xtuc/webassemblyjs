# js-webassembly-interpreter

> WebAssembly interpreter

This is meant to be a polyfill entirely written in JavaScript and with no dependencies at runtime.

## Examples

- [add](https://xtuc.github.io/js-webassembly-interpreter/examples/add.html)

## Components

### Compiler

Code parsing and manipulations.

#### AST

Tools to manipulate and use our internal AST. You can see its definitions [here](https://github.com/xtuc/js-webassembly-interpreter/blob/master/src/types/AST.js).

#### Parsing

- WebAssembly Text Format parser (tokenizer and grammar).

### Interpreter

#### Kernel

Provides core features (memory management, execution, ...).

#### Runtime

Our runtime instance values.

## Notes

-  get_local of identifier is not supported as in the binary format

## Licence

[GNU General Public License, version 2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html).
