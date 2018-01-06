// @flow

const LETTERS = /[a-z0-9_\/]/i;
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

function Token(type, value, line, column) {
  return {
    type,
    value,
    loc:{
      start: {
        line,
        column,
      }
    }
  };
}

function createToken(type: string) {
  return (v: string | number, line: number, col: number) =>
    Token(type, v, line, col);
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
  br_if: 'br_if',
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

  // Used by SourceLocation
  let column = 1;
  let line = 1;

  const tokens = [];

  function eatToken() {
    column++;
    current++;
  }

  while (current < input.length) {
    let char = input[current];

    if (char === '(') {
      tokens.push(OpenParenToken(char, line, column));

      eatToken();

      continue;
    }

    if (char === ')') {
      tokens.push(CloseParenToken(char, line, column));

      eatToken();
      continue;
    }

    if (isNewLine(char)) {
      line++;
      eatToken();
      column = 0;
      continue;
    }

    const WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      eatToken();
      continue;
    }

    if (char === '$') {
      char = input[++current];

      let value = '';

      while (idchar.test(char)) {
        value += char;
        char = input[++current];
      }

      // Shift by the length of the string
      column += value.length;

      tokens.push(IdentifierToken(value, line, column));

      continue;
    }

    const NUMBERS = /[0-9|.|_]/;
    const HEX_NUMBERS = /[0-9|A-F|a-f|_|.|p|P|-]/;
    if (NUMBERS.test(char) || char === '-' && NUMBERS.test(input[current + 1]) ) {
      let value = '';
      if (char === '-') {
        value += char;
        char = input[++current];
      }
      let numberLiterals = NUMBERS;

      if (char === '0' && input[current + 1].toUpperCase() === 'X') {
        value += '0x';
        numberLiterals = HEX_NUMBERS;
        char = input[current += 2];
      }

      while (numberLiterals.test(char)) {
        if (char !== '_') {
          value += char;
        }
        char = input[++current];
      }

      // Shift by the length of the string
      column += value.length;

      tokens.push(NumberToken(value, line, column));

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

      // Shift by the length of the string
      column += value.length;

      eatToken();

      tokens.push(StringToken(value, line, column));

      continue;
    }

    if (LETTERS.test(char)) {
      let value = '';

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // Shift by the length of the string
      column += value.length;

      /*
       * Handle MemberAccess
       */
      if (char === '.') {

        if (valtypes.indexOf(value) !== -1) {
          tokens.push(ValtypeToken(value, line, column));
        } else {
          tokens.push(NameToken(value, line, column));
        }

        value = '';
        char = input[++current];

        while (LETTERS.test(char)) {
          value += char;
          char = input[++current];
        }

        // Shift by the length of the string
        column += value.length;

        tokens.push(DotToken('.', line, column));
        tokens.push(NameToken(value, line, column));

        continue;
      }

      /*
       * Handle keywords
       */
      // $FlowIgnore
      if (typeof keywords[value] === 'string') {
        tokens.push(KeywordToken(value, line, column));

        // Shift by the length of the string
        column += value.length;

        continue;
      }

      /*
       * Handle types
       */
      if (valtypes.indexOf(value) !== -1) {
        tokens.push(ValtypeToken(value, line, column));

        // Shift by the length of the string
        column += value.length;

        continue;
      }

      /*
       * Handle literals
       */
      tokens.push(NameToken(value, line, column));

      // Shift by the length of the string
      column += value.length;

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
