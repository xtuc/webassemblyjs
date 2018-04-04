(module
  (func (export "select_i32") (param $lhs i32) (param $rhs i32) (param $cond i32) (result i32)
  (select (get_local $lhs) (get_local $rhs) (get_local $cond)))
  (func (export "select_i64") (param $lhs i64) (param $rhs i64) (param $cond i32) (result i64)
  (select (get_local $lhs) (get_local $rhs) (get_local $cond)))

  (func (export "select_f32") (param $lhs f32) (param $rhs f32) (param $cond i32) (result f32)
  (select (get_local $lhs) (get_local $rhs) (get_local $cond)))

  (func (export "select_f64") (param $lhs f64) (param $rhs f64) (param $cond i32) (result f64)
  (select (get_local $lhs) (get_local $rhs) (get_local $cond)))
)
