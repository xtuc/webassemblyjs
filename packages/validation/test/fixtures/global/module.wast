(module
  (global i32 (i32.const 1))

  (func $try-mutate-const-global
    (i32.const 1)
    (set_global 0)
  )
)
