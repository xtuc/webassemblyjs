# eslint-plugin-webassembly

ESLint plugin for WebAssembly

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-webassembly`:

```
$ npm install eslint-plugin-webassembly --save-dev
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
        "webassembly/non-unexisting-export": 2
    }
}
```

## Supported Rules

### `no-unexisting-export`

Checks that the exports exists, example:

Good:

```js
import("module.wasm").then(x => {
  x.test();
});
```

Bad:

```js
import("module.wasm").then(x => {
  x.noUnexistingExport();
});
```

## `Parsing error: The keyword 'import' is reserved`

ESLint doesn't support dynamic import out of the box. Make sure to check out https://github.com/babel/babel-eslint.
