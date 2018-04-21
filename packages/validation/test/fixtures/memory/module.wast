(module
  (memory $memory_0 1)
  (func
    (memory.grow (f32.const 0))
  )
  (func (result f32)
    (f32.const 0)
    (memory.size)
    (f32.add)
  )
)
