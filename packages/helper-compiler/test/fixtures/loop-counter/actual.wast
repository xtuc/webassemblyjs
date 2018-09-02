(module
  (func (export "test") (result i32)
    (local $inc i32)

    (loop $loop
      (i32.add
        (i32.const 1)
        (get_local $inc)
      )
      (set_local $inc)

      (i32.ne
        (get_local $inc)
        (i32.const 3)
      )
      (br_if 0)
    )

    (get_local $inc)
  )
)
