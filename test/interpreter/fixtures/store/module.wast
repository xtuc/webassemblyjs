(module
  (memory 1)
  (func $test 
    (i32.const 12)
    (i32.const 0x70000000)
    (i32.store)
  )
  (export "memory" (memory 0))
  (export "test" (func $test))
)