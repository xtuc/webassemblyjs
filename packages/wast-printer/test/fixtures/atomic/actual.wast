(module
  (memory 1 1 shared)

  (func (export "i32.atomic.load") (param $addr i32) (result i32) (i32.atomic.load (local.get $addr)))
)