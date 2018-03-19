(module
  (type (;0;) (func (result i32)))
  (type (;1;) (func (param i32) (result i32)))
  (import "./module" "getNumber" (func (;0;) (type 0)))
  (func (;1;) (type 1) (param i32) (result i32)
    get_local 0
    call 0
    i32.add)
  (export "addNumber" (func 1)))
