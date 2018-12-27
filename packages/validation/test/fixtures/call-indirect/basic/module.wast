(module
  (type (func (param i32)))
  (func (type 0) (param i32))

  (func
    (i32.const 0)

    (i32.const 1)
    (call_indirect (type 0))
  )
)
