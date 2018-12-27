(module
  (type (func (result i32)))
  (func (; 0 ;) (type 0) (result i32) (i32.const 1))
  (func (; 1 ;) (param i32))

  (func (; 2 ;)
    (i32.const 1)
    (call_indirect (type 0))
    (call 1)
  )
)
