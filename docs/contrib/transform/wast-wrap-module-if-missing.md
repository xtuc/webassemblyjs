# wast-wrap-module-if-missing

This is only used for the spec tests.

Wrapps the program body into a module if no top-level module were specified.

## Example

### In

```wast
(func)
```

### Out

```wast
(module
  (func)
)
```
