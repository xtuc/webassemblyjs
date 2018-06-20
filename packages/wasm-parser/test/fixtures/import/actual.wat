(module
  (import "a" "b" (func $f))
  (import "a" "c" (func $ff (param i32)))
  (import "a" "c" (func $fff (param i32) (result i32)))
)
