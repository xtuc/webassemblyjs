(module

  (func $type-arg-empty-vs-num (result i32)
   (block (result i32)
     (br 0)
     (i32.const 1)
   )
  )

  (func $type-br-operand-missing-in-block
   (i32.const 0)
   (block (result i32)
     (br 0)
   )
   (i32.eqz)
   (drop)
  )

  (func $type-br-operand-missing-in-if
   (block
     (i32.const 0)
     (i32.const 0)
     (if (result i32)
       (then
         (br 0)
       )
     )
   )
   (i32.eqz)
   (drop)
  )

)
