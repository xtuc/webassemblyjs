(module
  (func (param i32))
  (func (param i64))
  (func (param f32))
  (func (param f64))

  (func
    (local i32 i64 f32 f64)
    (get_local 0) (call 0)
    (get_local 1) (call 1)
    (get_local 2) (call 2)
    (get_local 3) (call 3)
  )
)
