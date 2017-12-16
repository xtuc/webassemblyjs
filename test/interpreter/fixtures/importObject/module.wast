(module
 (import "module" "fn" (func $fn (result i32)))
 (func $main
   (i32.const 16)
   (call $fn)
  )
)
