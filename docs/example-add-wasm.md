---
title: Add in WASM
id: example-add-wasm
---

## Client

<div id="exec">

```js
request = new XMLHttpRequest();
request.open('GET', '/example-add.wasm');
request.responseType = 'arraybuffer';
request.send();

request.onload = function() {
  var bytes = request.response;

  webassemblyInterpreter
    .instantiate(bytes)
    .then((module) => {

      var res = module.instance.exports.add(1, 1);
      document.getElementById("res").innerHTML = res;
    });

};
```

</div>

## Result

<div id="res">...</div>

## Binary

The binary is available here: [https://webassembly.js.org/example-add.wasm](/example-add.wasm).

<script src="https://bundle.run/webassembly-interpreter@0.0.29"></script>
<script src="/example-exec.js"></script>
