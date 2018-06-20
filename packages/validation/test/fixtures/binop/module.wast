(module
  (func
    (i32.add (i32.const 0) (f32.const 0))
  )
  (func $ff (result i32)
    (i32.add (i64.const 0) (i32.const 1))
  )
  (func (result i32)
    (i64.const 0)
    (i32.const 1)
    (i32.add)
  )
  (func
    (i32.div_s (f64.const 0) (i32.const 0))
  )
)
