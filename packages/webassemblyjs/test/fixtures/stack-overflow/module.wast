(module 
  (func $b
    (call $b)
  )
  (export "main" (func $b))
)
