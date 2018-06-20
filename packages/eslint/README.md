# eslint-plugin-webassembly

ESLint plugin for WebAssembly

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ yarn add eslint --save-dev
```

Next, install `eslint-plugin-webassembly`:

```
$ yarn add eslint-plugin-webassembly --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-webassembly` globally.

## Usage

Add `webassembly` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "webassembly"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "webassembly/no-unknown-export": 2
    }
}
```

## Supported Rules

### `no-unknown-export`

Checks that the exports exists, example:

Good:

```js
import("module.wasm").then(x => {
  x.test();
});

import("module.wasm").then(({test}) => {
  test();
});
```

Bad:

```js
import("module.wasm").then(x => {
  x.unknownExport();
});

import("module.wasm").then(({unknownExport}) => {
  unknownExport();
});
```

## `Parsing error: The keyword 'import' is reserved`

ESLint doesn't support dynamic import out of the box. Make sure to check out https://github.com/babel/babel-eslint.
