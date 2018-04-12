(module 
  (func $referenceda
    (nop)
  )
  (export "test" (func $referenceda))
  (func
    (call $referenceda)
  )
)
