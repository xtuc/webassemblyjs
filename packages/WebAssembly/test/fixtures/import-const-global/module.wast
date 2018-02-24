(module
  (import "env" "a" (global i32))
  (func (export "get") (result i32) (get_global 0))
)
