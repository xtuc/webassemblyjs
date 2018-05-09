(call_indirect (type 0) (i32.const 0))
(call_indirect (type $foo) (i32.const 0))

(call_indirect (i32.const 0))
(call_indirect (param i64) (i64.const 0) (i32.const 0))
(call_indirect (param i64) (param) (param f64 i32 i64)
  (i64.const 0) (f64.const 0) (i32.const 0) (i64.const 0) (i32.const 0)
)
(call_indirect (result) (i32.const 0))

(drop (i32.eqz (call_indirect (result i32) (i32.const 0))))
(drop (i32.eqz (call_indirect (result i32) (result) (i32.const 0))))

(drop (i32.eqz
  (call_indirect (param i64) (result i32) (i64.const 0) (i32.const 0))
))

(drop (i32.eqz
  (call_indirect
    (param) (param i64) (param) (param f64 i32 i64) (param) (param)
    (result) (result i32) (result) (result)
    (i64.const 0) (f64.const 0) (i32.const 0) (i64.const 0) (i32.const 0)
  )
))

(drop (i64.eqz
  (call_indirect (type $over-i64) (param i64) (result i64)
    (i64.const 0) (i32.const 0)
  )
))

