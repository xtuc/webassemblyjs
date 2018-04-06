(module (func $type-br-operand-missing-in-if
(block
(i32.const 0) (i32.const 0)
(if (result i32) (then (br 0)))
)
(i32.eqz) (drop)
))
