(module
  (import "module" "name" (func $name (param i32) (result i32)))
  (import "m" "a" (global (mut i32)))
  (import "m" "a" (global i32))

  (global $test i32 (i32.const 0))
  (global i32 (i32.const 1))
  (global (mut i32) (i32.const 1))

  (memory 1)
  (memory 1 0)
  (memory $foo 1 0)

  (func $add (param $lhs i32) (param $rhs i32) (result i32)
    (local i32)
    (local i64)
    (local f32)
    (local f64)

    (local $a i32)
    (local $b f32)

    (get_local $lhs)
    (get_local $rhs)
    (i32.add)
    (return (i32.const 1))
    (return)

    (block)
    (block $foo)
    (block $test (result i32))
    (block
      (nop)
    )

    (call $a)
    (call 1)
  )

  (export "add" (func $add))

  (table "a" 10 anyfunc)
  (table "b" 0 10 anyfunc)
  (table 10 anyfunc)
  (table 0 10 anyfunc)
  (table 0 anyfunc)
  (table $a 10 anyfunc)

  (func)
  (func $test)
)
