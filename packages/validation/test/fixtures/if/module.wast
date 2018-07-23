(module
  (func $type-if-operand-missing
    (if
      (then)
      (else)
    )
  )

  (func $type-if-operand-missing-in-block
    (i32.const 0)
    (loop
      (if
          (then)
          (else)
        )
    )
  )

  (func $type-if-operand-missing-in-if
    (i32.const 0)
    (i32.const 0)
    (if
      (then
        (if
            (then)
            (else)
          )
      )
      (else)
    )
  )

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

  (func $type-if-operand-missing-in-block
    (i32.const 0)
    (block
      (if
          (then)
          (else)
        )
    )
  )

  (func (param i32) (result i32)
  	(get_local 0)
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (f32.const 0)
      )
    )
  )
)
