---
title: Add in WATF
id: example-add-watf
---

## Input

<div id="input">

```wast
(module
  (func $add (param i32) (param i32) (result i32)
    (get_local 0)
    (get_local 1)
    (i32.add)
  )
  (export "add" (func $add))
)
```

</div>

## Client

<div id="exec">

```js
var code = document.getElementById("input").innerText;
var module = webassemblyInterpreter.instantiateFromSource(code);

var res = module.exports.add(1, 1);
document.getElementById("res").innerHTML = res;
```

</div>

## Result

<div id="res">...</div>

<script src="https://bundle.run/webassembly-interpreter@0.0.29"></script>
<script src="/example-exec.js"></script>
