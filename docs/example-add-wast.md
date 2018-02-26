---
title: Add in WAST
id: example-add-wast
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
var module = webassemblyjs.instantiateFromSource(code);

var res = module.exports.add(1, 1);
document.getElementById("res").innerHTML = res;
```

</div>

## Result

<div id="res">...</div>

<script src="https://bundle.run/webassemblyjs@1.0.0-y.8"></script>
<script src="/example-exec.js"></script>
