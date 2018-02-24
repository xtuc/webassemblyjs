(module
  (func $div (param f32) (param f32) (result f32)
   (get_local 0)
   (get_local 1)
   (f32.div)
  )
  (export "div" (func $div))
)
