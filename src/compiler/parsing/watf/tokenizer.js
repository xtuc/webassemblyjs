// @flow
const LETTERS = /[a-z0-9_]/i;
const idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
const valtypes = ['i32', 'i64', 'f32', 'f64'];

function Token(type, value) {
  return {
    type,
    value,
  };
}

function createToken(type) {
  return (v) => Token(type, v);
}

const tokens = {
  openParen: 'openParen',
  closeParen: 'closeParen',
  number: 'number',
  string: 'string',
  name: 'name',
  identifier: 'identifier',
  valtype: 'valtype',
  dot: 'dot',

  keyword: 'keyword',
};

const keywords = {
  module: 'module',
  func: 'func',
  param: 'param',
  result: 'result',
  export: 'export',
};

const CloseParenToken = createToken(tokens.closeParen);
const OpenParenToken = createToken(tokens.openParen);
const NumberToken = createToken(tokens.number);
const ValtypeToken = createToken(tokens.valtype);
const NameToken = createToken(tokens.name);
const IdentifierToken = createToken(tokens.identifier);
const KeywordToken = createToken(tokens.keyword);
const DotToken = createToken(tokens.dot);
const StringToken = createToken(tokens.string);

function tokenize(input: string) {
  let current = 0;
  const tokens = [];

  while (current < input.length) {
    let char = input[current];

    if (char === '(') {
      tokens.push(OpenParenToken(char));

      // Then we increment `current`
      current++;

      // And we `continue` onto the next cycle of the loop.
      continue;
    }

    if (char === ')') {
      tokens.push(CloseParenToken(char));

      current++;
      continue;
    }

    if (char === '$') {
      char = input[++current];

      let value = '';

      while (idchar.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push(IdentifierToken(value));

      continue;
    }

    const WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    const NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';

      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      value = parseInt(value);

      tokens.push(NumberToken(value));

      continue;
    }

    if (char === '"') {
      let value = '';

      char = input[++current];

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      if (char !== '"') {
        throw new Error('Unterminated string constant');
      }

      current++;

      tokens.push(StringToken(value));

      continue;
    }

    if (LETTERS.test(char)) {
      let value = '';

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      /*
       * Handle MemberAccess
       */
      if (char === '.') {

        if (valtypes.indexOf(value) !== -1) {
          tokens.push(ValtypeToken(value));
        } else {
          tokens.push(NameToken(value));
        }

        value = '';
        char = input[++current];

        while (LETTERS.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push(DotToken());
        tokens.push(NameToken(value));

        continue;
      }

      /*
       * Handle keywords
       */
      if (typeof keywords[value] === 'string') {
        tokens.push(KeywordToken(value));

        continue;
      }

      /*
       * Handle types
       */
      if (valtypes.indexOf(value) !== -1) {
        tokens.push(ValtypeToken(value));

        continue;
      }

      /*
       * Handle literals
       */
      tokens.push(NameToken(value));

      continue;
    }

    throw new TypeError('Unknown char: ' + char);
  }

  return tokens;
}

module.exports = {
  tokenize,
  tokens,
  keywords,
};
