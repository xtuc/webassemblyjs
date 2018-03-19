(module 
  (type (func (param i32)))
  (func $func_1 (param i32)
    (nop)
  )
  (export "foobar" (func $func_1))
)
