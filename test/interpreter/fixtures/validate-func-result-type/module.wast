(module
  (func $a (result i32)
    (i64.const 1)
  )

  (func $b (result i64)
    (i32.const 1)
  )

  (func $c (result i64)
    (i32.add)
  )
)
