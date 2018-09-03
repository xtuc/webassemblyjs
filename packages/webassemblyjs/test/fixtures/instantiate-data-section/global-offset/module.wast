(module
  (import "m" "a" (global i32))
  (memory 20)
  (data 0 (get_global 0) "abc")
  (export "memory" (memory 0))
)
