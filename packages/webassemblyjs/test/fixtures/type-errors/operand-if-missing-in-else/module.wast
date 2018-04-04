(module 
  (func $type-if-operand-missing-in-else
    (i32.const 0)
    (i32.const 0)
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (if
            (then)
            (else)
          )
        (i32.const 0)
      )
    )
    (drop)
  )
)
