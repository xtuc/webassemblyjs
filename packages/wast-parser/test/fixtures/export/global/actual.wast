(module
  (global i32 (i32.const 0))
  (export "a" (global 0))

  (global $g1 i32 (i32.const 0))
  (export "a" (global $g1))
)
