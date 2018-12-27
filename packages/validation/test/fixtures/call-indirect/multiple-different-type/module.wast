(module
  (table 1 anyfunc)

  (type (func (param i32 i64 f32 f64)))
  (func (type 0))

  (func
    (i32.const 1)
    (i64.const 0)
    (f32.const 0)
    (f64.const 0)

    (i32.const 1)
    (call_indirect (type 0))
  )
)
