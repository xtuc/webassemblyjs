(module
  (func
    (br 1)
  )
  (func
    (loop)
    (br 1)
  )
  (func
    (loop)
    (loop)
    (br 1)
  )
  (func (param i32)
  	(get_local 0)
    (if
      (then
        (nop)
      )
      (else
        (nop)
      )
    )
    (br 1)
  )
  (func (result f32)
    (f32.const 0)
    (br 0)
  )
)
