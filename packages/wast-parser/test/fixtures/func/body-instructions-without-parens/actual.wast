(module
  (func (br_table 0 1 3))

  (func $without-paren (i32.const 1) drop)

  (func i32.const 1 drop)

  (func (result i32) (return (i32.const 1)))

)
