(module
  (global $test (import "env" "a") i32 (i32.const 0))
  (global (import "env" "b") i32 (i32.const 1))
  (global (import "env" "c") (mut i32) (i32.const 1))
)
