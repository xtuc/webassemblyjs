(module
  (func $abs (param f32) (result f32)
   (get_local 0)
   (f32.abs)
  )
  (export "abs" (func $abs))
)
