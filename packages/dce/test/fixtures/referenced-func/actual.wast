(module
  (func $referenceda (export "test")
    (nop)
  )
  (func
    (call $referenceda)
  )
)
