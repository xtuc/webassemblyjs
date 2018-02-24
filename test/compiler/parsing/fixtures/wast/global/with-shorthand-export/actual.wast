(module
  (global $test (export "a") i32 (i32.const 0))
  (global (export "b") i32 (i32.const 1))
  (global (export "c") (mut i32) (i32.const 1))
)
