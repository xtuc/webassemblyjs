# Contributing

Contributions are always welcome, no matter how large or small.

## Chat

Feel free to open an issue and/or reach out @xtuc.

## Developing on the interpreter

### Setup

```sh
git clone https://github.com/xtuc/js-webassembly-interpreter
cd js-webassembly-interpreter

npm install
```

### Building

```sh
make build
```

### Running linting/tests

You can run lint via:

```sh
make lint
```

You can run eslint's autofix via:

```sh
make fix
```

You can run tests via:

```sh
make test
```

## Developing on the website

The website is located in the directory: `website` and uses [docusaurus](https://docusaurus.io).

The following commands will assume that you already are in the directory.

### Setup

```sh
yarn install
```

### Start

```sh
yarn run start
```

The website will be available at [localhost:3000](http://localhost:3000).
