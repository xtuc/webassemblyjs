(func (param $c f64) (param $a i32) (param $b i64)
  (get_local $a)
  (get_local $b)
  (get_local $c)
  (get_local $a)

  (set_local $a (i32.const 1))
  (tee_local $a (i32.const 1))
)
