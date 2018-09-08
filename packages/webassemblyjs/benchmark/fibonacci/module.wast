(module
 (table 0 anyfunc)
 (memory $0 1)
 (export "main" (func $_Z19fibonacci_recursivej))
 (func $_Z19fibonacci_recursivej (; 0 ;) (param $0 i32) (result i32)
  (block $label$0
   (block $label$1
    (br_if $label$1
     (i32.eqz
      (get_local $0)
     )
    )
    (br_if $label$0
     (i32.ne
      (get_local $0)
      (i32.const 1)
     )
    )
    (return
     (i32.const 1)
    )
   )
   (return
    (i32.const 0)
   )
  )
  (i32.add
   (call $_Z19fibonacci_recursivej
    (i32.add
     (get_local $0)
     (i32.const -1)
    )
   )
   (call $_Z19fibonacci_recursivej
    (i32.add
     (get_local $0)
     (i32.const -2)
    )
   )
  )
 )
)

