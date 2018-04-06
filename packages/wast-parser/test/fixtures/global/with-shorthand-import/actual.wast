(module
  (global $test (import "env" "a") i32)
  (global (import "env" "b") i32)
  (global (import "env" "c") (mut i32))

  (global (import "m" "a") (mut i32))
)
