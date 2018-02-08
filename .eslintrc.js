/* eslint-disable */

module.exports = {
  parser: 'babel-eslint',
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:flowtype/recommended'
  ],
  plugins: [
    'flowtype',
    'mocha',
    'flowtype-errors',
    'prettier'
  ],
  rules: {
    "mocha/no-exclusive-tests": "error",
    "mocha/no-identical-title": "error",
    "mocha/no-skipped-tests": "warn",
    "prettier/prettier": "error",

    'flowtype-errors/show-errors': "error",

    camelcase: 'off',
    'comma-dangle': 'off',
    'consistent-return': 'off',
    curly: 'off',
    'linebreak-style': ['error', 'unix'],
    'key-spacing': 'off',
    'no-case-declarations': 'off',
    'no-cond-assign': 'off',
    'no-console': 'off',
    'no-constant-condition': 'off',
    'no-empty': 'off',
    'no-fallthrough': 'off',
    'no-inner-declarations': 'off',
    'no-multi-spaces': 'off',
    'no-labels': 'off',
    'no-loop-func': 'off',
    'no-process-exit': 'off',
    'no-return-assign': 'off',
    'no-shadow': 'off',
    'no-unreachable': 'off',
    'no-use-before-define': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    strict: 'off'
  },
  parserOptions: {
    ecmaVersion: 8
  },
  globals: {
    "React": true
  },
  env: {
    node: true,
    browser: true,
    es6: true,
    mocha: true
  }
};
