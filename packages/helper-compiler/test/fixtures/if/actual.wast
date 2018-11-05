(module
  (func (param i32) (result i32)
    (if (result i32) (get_local 0)
      (then (i32.const 1))
      (else (i32.const 0))
    )
  )
)
