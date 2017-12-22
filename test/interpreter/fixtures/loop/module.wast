(module
 (import "module" "fn" (func $fn (result i32)))
 (func $main (
  (loop i32 (
    (nop)
    (nop)
    (nop)
    (i32.const 7)
  ))
 ))
 (export "main" (func $main))
)
