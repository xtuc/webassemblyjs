(module
  (elem (i32.const 0))
  (elem (i32.const 0) $f)

  (elem (offset (i32.const 0)))
  (elem (offset (nop) (i32.const 0)))

  (elem 0 (i32.const 1) $f $g)
  (elem 0 (i32.const 1) 1 0)
)
