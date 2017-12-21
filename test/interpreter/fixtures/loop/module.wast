(module
 (import "module" "fn" (func $fn (result i32)))
 (func $main
  (loop (nop))
 )
 (export "main" (func $main))
)
