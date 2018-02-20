---
title: Usage
id: usage
---

## CDN

You can import `https://bundle.run/webassembly-interpreter` and the `webassemblyInterpreter` object will be accessible.

## npm

```sh
npm install webassembly-interpreter
```

### Command line interface

- `wasmdump FILENAME`: decodes a WASM binary and dumps its content
- `wasmast FILENAME`: prints the AST of the WASM binary.
- `wasmrun FILENAME [ENTRYPOINT]`: runs the WASM binary (uses the start section by default as entrypoint).
- `wasm2wast FILENAME`: prints the binary as WAST.
- `wastast FILENAME`: prints the WAST as an AST.
