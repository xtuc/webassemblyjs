(module
 (func $asdf (export "singular") (result i32)
  (loop
    (nop)
  )

  (loop (result i32)
    (i32.const 7)
  )
 )
)
