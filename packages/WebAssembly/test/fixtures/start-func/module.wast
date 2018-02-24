(module
  (import "env" "cb" (func $cb))
  (func $start
    (call $cb)
  )
  (start $start)
)
