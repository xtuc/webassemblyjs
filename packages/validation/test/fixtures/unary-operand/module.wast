(module
  (func $type-unary-operand-missing-in-block
    (i32.const 0)
    (block
      (i32.eqz)
      (drop)
    )
  )
  (func $type-unary-operand-missing-in-else
    (i32.const 0)
    (i32.const 0)
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (i32.eqz)
      )
    )
    (drop)
  )
  (func $type-unary-operand-missing-in-else
    (i32.const 0)
    (i32.const 0)
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (i32.eqz)
      )
    )
    (drop)
  )
  (func $type-unary-operand-missing-in-loop
    (i32.const 0)
    (loop
      (i32.eqz)
      (drop)
    )
  )
  (func $type-unary-operand-missing
    (i32.eqz)
    (drop)
  )
)
