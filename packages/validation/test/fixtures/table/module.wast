(module
  (func $type-arg-void-vs-num (result i32)
    (block (br_table 0 (i32.const 1)) (i32.const 1))
  )
  (func $type-arg-void-vs-num (result i32)
    (block (result i32) (br_table 0 (nop) (i32.const 1)) (i32.const 1))
  )
  (func $type-arg-num-vs-num (result i32)
    (block (result i32)
      (br_table 0 0 0 (i64.const 1) (i32.const 1)) (i32.const 1)
    )
  )
  (func $type-arg-num-vs-arg-num
    (block
      (block (result f32)
        (br_table 0 1 (f32.const 0) (i32.const 0))
      )
      (drop)
    )
  )
  (func $type-index-void-vs-i32
    (block (br_table 0 0 0 (nop)))
  )
  (func $type-index-num-vs-i32
    (block (br_table 0 (i64.const 0)))
  )
  (func $type-arg-index-void-vs-i32 (result i32)
    (block (result i32) (br_table 0 0 (i32.const 0) (nop)) (i32.const 1))
  )
  (func $type-arg-void-vs-num-nested (result i32)
    (block (result i32) (i32.const 0) (block (br_table 1 (i32.const 0))))
  )
  (func $type-arg-index-num-vs-i32 (result i32)
    (block (result i32)
      (br_table 0 0 (i32.const 0) (i64.const 0)) (i32.const 1)
    )
  )
)
