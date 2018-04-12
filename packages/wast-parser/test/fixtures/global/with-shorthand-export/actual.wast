(module 
  (global $test i32 (i32.const 0))
  (export "a")
  (global i32 (i32.const 1))
  (export "b")
  (global (mut i32) (i32.const 1))
  (export "c")
)
