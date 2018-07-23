(module
  (func
    (drop (i32.add (get_global 0) (get_global 1)))
    (i32.add (call 0 (get_global 0) (get_global 1)) (i32.const 1))
  )
)
