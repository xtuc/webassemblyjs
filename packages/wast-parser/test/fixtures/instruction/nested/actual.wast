(func
  (drop (i32.const 4))
  (drop)
  (drop)
  (br_if 0 (i32.const 10) (get_local 0))
  (br_table 0 (i32.const 1))
)
