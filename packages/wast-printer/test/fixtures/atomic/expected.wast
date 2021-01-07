(module
  (memory $memory_0 1 1 shared)
  (func (param $addr i32) (result i32)
    (i32.atomic.load (local.get $addr))
  )
  (export "i32.atomic.load" (func $func_0))
)