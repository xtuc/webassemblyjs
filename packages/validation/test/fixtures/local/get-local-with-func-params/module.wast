(module
  (func (param i32))
  (func (param i64))

  (func (param i32 i32)
    (local i64 i64)
    (get_local 0) (call 0)
    (get_local 1) (call 0)
    (get_local 2) (call 1)
    (get_local 3) (call 1)
  )
)
