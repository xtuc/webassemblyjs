(module 
  (type (func))
  (func $referenceda
    (nop)
  )
  (func
    (call $referenceda)
  )
  (export "test" (func $referenceda))
)
