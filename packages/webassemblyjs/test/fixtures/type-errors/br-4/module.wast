(module (func $type-br-operand-missing-in-else
(block
(i32.const 0) (i32.const 0)
(if (result i32) (then (i32.const 0)) (else (br 0)))
)
(i32.eqz) (drop)
))
