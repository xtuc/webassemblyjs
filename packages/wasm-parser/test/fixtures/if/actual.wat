(module
  (func
    (if
      (then (nop))
      (else)
    )
  )

  (func
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (i32.eqz)
      )
    )
  )

  (func
    (if (result i32)
      (then
        (i32.const 0)
      )
      (else
        (if (result i32)
          (then
            (i32.const 0)
          )
          (else
            (i32.eqz)
          )
        )
      )
    )
  )
)

