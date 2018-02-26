# @webassemblyjs/dce

> Eliminate unused functions in your WASM binary.

## Features

- Removes the export instruction
- Replaces the func with an empty one (to preserve the index)

## Example

```diff
(module
-   (func $func_1 (param i32) (param i32) (result i32)
-     (get_local 0)
-     (get_local 1)
-     (i32.add)
-   )
-   (export "add" (func $func_1))
+   (func)
)
```

## FAQ

### Why not use binaryen?

First you can see the JavaScript API is specified here https://github.com/WebAssembly/binaryen/wiki/binaryen.js-API.

I encounter some issues (like removing the `func` wasn't working) and added an additional parse of the WASM file.

## Third party licenses

- [js-webassembly-interpreter](https://github.com/xtuc/js-webassembly-interpreter) - GNU General Public License v2.0 see [LICENCE](https://github.com/xtuc/js-webassembly-interpreter/blob/master/LICENCE)

## TODO

- Support DCE for exported `global`, `memory`, `table`.
- Remove elements only used by this function (other imports, data, etc).
- Add CLI for node projects or libs
