(module 
  (func $func_1
    (nop)
  )
  (func $func_2
    (call 0)
  )
  (export "test" (func $func_1))
)
