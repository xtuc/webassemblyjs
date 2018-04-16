(module
  (type (func (param i32)))
  (func $foobar (param i32)
    (nop)
  )
  (export "foobar" (func $foobar))
)
