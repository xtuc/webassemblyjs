(module 
  (func $type-unary-operand-missing-in-loop
    (i32.const 0)
    (loop
      (i32.eqz)
      (drop)
    )
  )
)
