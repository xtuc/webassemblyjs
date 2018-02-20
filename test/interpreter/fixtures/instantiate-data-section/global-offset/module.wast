(module
  (memory 20)
  (import "m" "a" (global i32))
  ;; (global $a (import "m" "a") i32)
  (data 0 (get_global 0) "abc")
  (export "memory" (memory 0))
)