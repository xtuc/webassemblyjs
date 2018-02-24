(module
  (func $neg (param f32) (result f32)
   (get_local 0)
   (f32.neg)
  )
  (export "neg" (func $neg))
)
