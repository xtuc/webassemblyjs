(module
  (func
    (block (result i32)
      (f32.const 0)
    )
    (drop)
  )

  (func $block-value
    (i32.add
      (block (result i32) (i32.const 1))
      (block (result i32) (i32.const 1))
    )
    (drop)
  )
)
