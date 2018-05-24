# wast-loader

> Webpack loader for WebAssembly text format

## Install

```sh
yarn add wast-loader
```

## Usage

`webpack.config.js`:

```js
module: {
  rules: [
    {
      test: /\.wast$/,
      loader: "wast-loader",
      type: "webassembly/experimental"
    }
  ]
},
```
