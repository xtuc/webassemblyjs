(module
  (func $add (result f64)
    (i64.const 1844674407379551615)
    (i64.const 10000)
    (i64.add)
    (f64.reinterpret/i64)
  )
  (export "add" (func $add))
)
