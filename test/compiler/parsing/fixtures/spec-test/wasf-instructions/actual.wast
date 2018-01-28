(module
  (func
    (assert_return (call 0) (i32.const 1))
  )

  (assert_return (call 0) (i32.const 1))
  (invoke "foo")
  (assert_return_canonical_nan (invoke "add" (f32.const -0x0p+0) (f32.const -nan)))
  (assert_return_arithmetic_nan (invoke "add" (f32.const -0x0p+0) (f32.const nan:0x200000)))
  (assert_trap (invoke "type-i32") "unreachable")
  (assert_malformed (module binary "") "unexpected end")
  (assert_invalid (module (memory 0) (memory 0)) "multiple memories")

  (assert_unlinkable
    (module (import "test" "unknown" (func)))
    "unknown import"
  )
)
