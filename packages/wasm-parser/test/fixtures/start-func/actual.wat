(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func))
  (import "./tracker" "trackWasm" (func (;0;) (type 0)))
  (import "./c.js" "magicNumber" (global (;0;) i32))
  (func (;1;) (type 1)
    get_global 0
    call 0)
  (start 1))
