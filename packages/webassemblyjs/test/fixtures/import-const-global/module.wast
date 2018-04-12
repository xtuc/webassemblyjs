(module 
  (import "env" "a" (global i32))
  (func (result i32)
    (get_global 0)
  )
  (export "get" (func $func_0))
)
