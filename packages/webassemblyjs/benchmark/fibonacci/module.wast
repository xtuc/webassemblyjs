(module
  (memory 0)
  (type $rustfn-0-14 (func (param i32 i32) (result i32)))
  (type $rustfn-0-28 (func (param i32 i32) (result i32)))
  (type $rustfn-0-39 (func (param i32 i32) (result i32)))
  (type $rustfn-0-42 (func (param i32) (result i32)))
  (type $rustfn-0-44 (func (param i32) (result i32)))
  (func $fibonacci_recursive (type $rustfn-0-42) (param $0 i32) (result i32)
    (local $1 i32)
    (local $2 i32)
    (block $shape$1$break
      (if
        (i32.eq
          (get_local $0)
          (i32.const 0)
        )
        (set_local $1
          (i32.const 2)
        )
        (block
          (if
            (i32.eq
              (get_local $0)
              (i32.const 1)
            )
            (block
              (set_local $1
                (i32.const 2)
              )
              (br $shape$1$break)
            )
          )
          (set_local $2
            (i32.const 0)
          )
        )
      )
    )
    (if
      (i32.eq
        (get_local $1)
        (i32.const 2)
      )
      (set_local $2
        (i32.const 1)
      )
    )
    (if
      (get_local $2)
      (get_local $0)
      (i32.add
        (call $fibonacci_recursive
          (i32.sub
            (get_local $0)
            (i32.const 1)
          )
        )
        (call $fibonacci_recursive
          (i32.sub
            (get_local $0)
            (i32.const 2)
          )
        )
      )
    )
  )
  (func (export "main") (type $rustfn-0-44) (param $0 i32) (result i32)
    (call $fibonacci_recursive
      (get_local $0)
    )
  )
)

