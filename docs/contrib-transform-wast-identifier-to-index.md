---
title: wast-identifer-to-index transformation
id: contrib-transform-wast-identifier-to-index
---

Transforms some WAST semantics into WAT or WASM (actually specs semantics).

WAST allows you some handy shortcuts, like providing the identifier of a local instead of its index.

## Example (refering to a param)

### In

```wast
(func (param $name i32)
 (get_local $name)
)
```

### Out

```wast
(func (param i32)
 (get_local 0)
)
```

## Example (refering to a func)

### In

```wast
(func $name)
(func
 (call $name)
)
```

### Out

```wast
;; first function in moduleinst.funcaddrs (index 0)
(func $name)

(func
 (call 0)
)
```
