// @flow

const LETTERS = /[a-z0-9_]/i;
const idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
const valtypes = ['i32', 'i64', 'f32', 'f64'];

/**
 * FIXME(sven): this is not spec compliant
 * A name string must form a valid UTF-8 encoding as defined by Unicode
 * (Section 2.5) (http://www.unicode.org/versions/Unicode10.0.0/)
 *
 * https://webassembly.github.io/spec/text/values.html#names
 */
const name = /[a-z0-9_-]/i;

function isNewLine(char: string): boolean {
  return char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13;
}

function Token(type, value, line) {
  return {
    type,
    value,
    loc: {
      line,
    }
  };
}

function createToken(type: string) {
  return (v: string | number, line: number) => Token(type, v, line);
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
  loop: 'loop',
  block: 'block',
  if: 'if',
  then: 'then',
  else: 'else',
  call: 'call',
  import: 'import',
  br_table: 'br_table',
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
  let line = 1;
  const tokens = [];

  while (current < input.length) {
    let char = input[current];

    if (char === '(') {
      tokens.push(OpenParenToken(char, line));

      // Then we increment `current`
      current++;

      // And we `continue` onto the next cycle of the loop.
      continue;
    }

    if (char === ')') {
      tokens.push(CloseParenToken(char, line));

      current++;
      continue;
    }

    if (isNewLine(char)) {
      line++;
      current++;
      continue;
    }

    const WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
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

      tokens.push(IdentifierToken(value, line));

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

      tokens.push(NumberToken(value, line));

      continue;
    }

    if (char === '"') {
      let value = '';

      char = input[++current];

      while (name.test(char)) {
        value += char;
        char = input[++current];
      }

      if (char !== '"') {
        throw new Error('Unterminated string constant');
      }

      current++;

      tokens.push(StringToken(value, line));

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
          tokens.push(ValtypeToken(value, line));
        } else {
          tokens.push(NameToken(value, line));
        }

        value = '';
        char = input[++current];

        while (LETTERS.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push(DotToken('.', line));
        tokens.push(NameToken(value, line));

        continue;
      }

      /*
       * Handle keywords
       */
      // $FlowIgnore
      if (typeof keywords[value] === 'string') {
        tokens.push(KeywordToken(value, line));

        continue;
      }

      /*
       * Handle types
       */
      if (valtypes.indexOf(value) !== -1) {
        tokens.push(ValtypeToken(value, line));

        continue;
      }

      /*
       * Handle literals
       */
      tokens.push(NameToken(value, line));

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
