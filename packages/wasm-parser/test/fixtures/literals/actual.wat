(module
  (func
   (i32.const 1)

   (i64.const 1)
   (i64.const 0)
   (i64.const 0xFFFFFFFF)

   (f32.const 1)
   (f64.const 1)

   (f64.const 0.1)

   (f32.const nan)
   (f32.const nan:0x2345)
   (f32.const -nan:0x1004)
   (f32.const inf)
   (f32.const -nan)
   (f32.const -inf)
   (f32.const +nan)
   (f32.const +inf)

   (f64.const nan)
   (f64.const nan:0x2345)
   (f64.const -nan:0x1004)
   (f64.const inf)
   (f64.const -nan)
   (f64.const -inf)
   (f64.const +nan)
   (f64.const +inf)
  )
)
