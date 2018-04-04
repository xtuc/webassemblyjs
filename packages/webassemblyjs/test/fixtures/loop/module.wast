(module 
  (func $asdf (result i32)
    (loop
      (nop)
    )
    (loop (result i32)
      (i32.const 7)
    )
  )
  (export "singular" (func $asdf))
)
