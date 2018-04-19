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
    (if
	  (then (nop))
	  (else (nop))
	)
	(br 1)
  )
)
