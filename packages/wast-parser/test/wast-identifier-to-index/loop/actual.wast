(func $a)
(func (export "as-loop-mid") (result i32)
  (loop (result i32) (call $a) (br 1 (i32.const 4)) (i32.const 2))
)
