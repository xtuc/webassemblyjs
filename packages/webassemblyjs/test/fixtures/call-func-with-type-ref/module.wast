(module
  (type $i32return (func (result i32)))
  (func $one (type $i32return) (i32.const 1))
  (func $two (type 0) (i32.const 2))

  (func (export "callWithNamedType") (result i32)
    (call $one)
  )

  (func (export "callWithIndexedType") (result i32)
    (call $two)
  )
)
