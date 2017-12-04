// @flow

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
};

const keywords = {
  module: 'module'
};

const CloseParenToken = createToken(tokens.closeParen);
const OpenParenToken = createToken(tokens.openParen);
const NumberToken = createToken(tokens.number);
const StringToken = createToken(tokens.string);
const NameToken = createToken(tokens.name);

const ModuleKeywordToken = createToken(keywords.module);

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

      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      char = input[++current];

      tokens.push(StringToken(value));

      continue;
    }

    const LETTERS = /[a-z0-9:]/i;
    if (LETTERS.test(char)) {
      let value = '';

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      if (value === keywords.module) {
        tokens.push(ModuleKeywordToken());
      } else {
        tokens.push(NameToken(value));
      }

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
