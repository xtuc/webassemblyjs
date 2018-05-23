# @webassemblyjs/wast-loader

> Webpack loader for WebAssembly text format

## Install

```sh
yarn add @webassemblyjs/wast-loader
```

## Usage

`webpack.config.js`:

```js
module: {
  rules: [
    {
      test: /\.wast$/,
      loader: "@webassemblyjs/wast-loader",
      type: "webassembly/experimental"
    }
  ]
},
```
