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

  (br_if 0 (i32.const 10) (get_local 0))

  (br_table 0
    (block (result i32)
      (drop (br_if 1 (i32.const 8) (get_local 0))) (i32.const 4)
    )
    (i32.const 1)
  )
)
