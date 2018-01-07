(module
  (func $one (result i32) (i32.const 1))

  (func (export "callByName") (result i32)
    (call $one)
  )

  (func (export "callByIndex") (result i32)
    (call 1)
  )
)
