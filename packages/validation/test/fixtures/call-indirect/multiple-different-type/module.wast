(module
  (type (func (param i32 i64 f32 f64)))
  (func (type 0) (param i32 i64 f32 f64))

  (func
    (f64.const 0)
    (f32.const 0)
    (i64.const 0)
    (i32.const 0)
    (call_indirect (type 0))
  )
)
