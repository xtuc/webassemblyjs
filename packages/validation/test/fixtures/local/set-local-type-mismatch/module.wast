(module
  (func $i32-mismatch
    (local i32)
    (f32.const 1) (set_local 0)
  )
  (func $i64-mismatch
    (local i64)
    (f32.const 1) (set_local 0)
  )
  (func $f32-mismatch
    (local f32)
    (i32.const 1) (set_local 0)
  )
  (func $f64-mismatch
    (local f64)
    (i32.const 1) (set_local 0)
  )
)
