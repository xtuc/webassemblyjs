(func
  (drop (i32.const 4))
  (drop (block $t (br 1 (i32.const 8)) (i32.const 1)))

  (drop
    (block (result i32)
      (drop (i32.const 4))
      (drop (block $a (br 1 (i32.const 8)) (i32.const 1)))
      (i32.const 32)
    )
  )
)
