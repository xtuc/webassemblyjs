(module
  (func $reinterpret_f32_i32 (param f32) (result i32)
   (get_local 0)
   (i32.reinterpret/f32)
  )
  (invoke "reinterpret_f32_i32" (f32.const nan))
  (export "reinterpret_f32_i32" (func $reinterpret_f32_i32))
)
