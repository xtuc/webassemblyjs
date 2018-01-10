(module
  (func $test (result i32) (
    (i64.const 9007199254740992)
    (i64.const 1)
    (i64.add)
    (i64.const 9007199254740992)
    (i64.sub)
  ))
  (export "test" (func $test))
)
