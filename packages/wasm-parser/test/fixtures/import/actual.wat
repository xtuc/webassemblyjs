(module
  (import "a" "b" (func))
  (import "a" "c" (func (param i32)))
  (import "a" "c" (func (param i32) (result i32)))
)
