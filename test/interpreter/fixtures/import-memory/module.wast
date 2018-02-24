(module
  (import "env" "mem" (memory 1))

  (func (export "get") (result i32)
    (i32.load8_s (i32.const 0))
  )
)
