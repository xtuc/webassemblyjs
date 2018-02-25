(module
  (func (export "add1") (param i32) (result i32)
    (i32.add (get_local 0) (i32.const 1))
  )
)
