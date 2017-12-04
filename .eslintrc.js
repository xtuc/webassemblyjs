/* eslint-disable */

module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:flowtype/recommended'
  ],
  plugins: [
    'flowtype',
    'mocha',
    'flowtype-errors'
  ],
  rules: {
    "mocha/no-exclusive-tests": "error",
    "mocha/no-identical-title": "error",
    "mocha/no-skipped-tests": "warn",
    'flowtype-errors/show-errors': 2,
    'array-bracket-spacing': ['error', 'never'],
    'object-curly-spacing': ['error', 'never'],
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': ['error', {before: true, after: true}],
    camelcase: 'off',
    'comma-dangle': 'off',
    'consistent-return': 'off',
    curly: 'off',
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'key-spacing': 'off',
    'keyword-spacing': 'error',
    'max-len': ['error', 110, 2],
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
    'no-trailing-spaces': 'error',
    'no-underscore-dangle': 'off',
    'no-unreachable': 'off',
    'no-use-before-define': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    quotes: ['error', 'single', {allowTemplateLiterals: true}],
    'space-before-blocks': ['error', 'always'],
    'space-infix-ops': 'error',
    semi: ['error', 'always'],
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
