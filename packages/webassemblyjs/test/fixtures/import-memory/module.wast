(module 
  (import "env" "mem" )
  (func (result i32)
    (i32.load8_s (i32.const 0))
  )
  (export "get" (func $func_0))
)
