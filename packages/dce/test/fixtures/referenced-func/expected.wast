(module 
  (type (func))
  (func $referenceda
    (nop)
  )
  (func $func_1
    (call $referenceda)
  )
  (export "test" (func $referenceda))
)
