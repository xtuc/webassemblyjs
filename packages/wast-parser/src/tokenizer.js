// @flow

const { codeFrameColumns } = require("@babel/code-frame");

function showCodeFrame(source: string, line: number, column: number) {
  const loc = {
    start: { line, column }
  };

  const out = codeFrameColumns(source, loc);

  process.stdout.write(out + "\n");
}

const WHITESPACE = /\s/;
const LETTERS = /[a-z0-9_/]/i;
const idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
const valtypes = ["i32", "i64", "f32", "f64"];

const NUMBERS = /[0-9|.|_]/;
const NUMBER_KEYWORDS = /nan|inf/;
const HEX_NUMBERS = /[0-9|A-F|a-f|_|.|p|P|-]/;

function isNewLine(char: string): boolean {
  return char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13;
}

function Token(type, value, line, column, opts = {}) {
  const token = {
    type,
    value,
    loc: {
      start: {
        line,
        column
      }
    }
  };

  if (Object.keys(opts).length > 0) {
    // $FlowIgnore
    token["opts"] = opts;
  }

  return token;
}

function createToken(type: string) {
  return (v: string | number, line: number, col: number, opts: Object = {}) =>
    Token(type, v, line, col, opts);
}

const tokens = {
  openParen: "openParen",
  closeParen: "closeParen",
  number: "number",
  string: "string",
  name: "name",
  identifier: "identifier",
  valtype: "valtype",
  dot: "dot",
  comment: "comment",
  equal: "equal",

  keyword: "keyword"
};

const keywords = {
  module: "module",
  func: "func",
  param: "param",
  result: "result",
  export: "export",
  loop: "loop",
  block: "block",
  if: "if",
  then: "then",
  else: "else",
  call: "call",
  call_indirect: "call_indirect",
  import: "import",
  memory: "memory",
  table: "table",
  global: "global",
  anyfunc: "anyfunc",
  mut: "mut",
  data: "data",
  type: "type",
  elem: "elem",
  start: "start",
  offset: "offset"
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
const CommentToken = createToken(tokens.comment);
const EqualToken = createToken(tokens.equal);

function tokenize(input: string) {
  let current = 0;
  let char = input[current];

  // Used by SourceLocation
  let column = 1;
  let line = 1;

  const tokens = [];

  /**
   * Can be used to look at the next character(s).
   *
   * The default behavior `lookahead()` simply returns the next character without consuming it.
   *
   * @param int length How many characters to query. Default = 1
   * @param int offset How many characters to skip forward from current one. Default = 1
   *
   */
  function lookahead(length = 1, offset = 1) {
    return input.substring(current + offset, current + offset + length);
  }

  /**
   * Can be used to look at the last few character(s).
   *
   * The default behavior `lookbehind()` simply returns the last character.
   *
   * @param int length How many characters to query. Default = 1
   * @param int offset How many characters to skip back from current one. Default = 1
   *
   */
  function lookbehind(length = 1, offset = 1) {
    return input.substring(current - offset, current - offset + length);
  }

  function eatToken() {
    column++;
    current++;
  }

  function eatCharacter(amount = 1) {
    column += amount;
    char = input[(current += amount)];
  }

  while (current < input.length) {
    char = input[current];

    // ;;
    if (char === ";" && lookahead() === ";") {
      eatCharacter(2);

      let text = "";

      while (!isNewLine(char)) {
        text += char;
        eatCharacter();

        if (char === undefined) {
          break;
        }
      }

      // Shift by the length of the string
      column += text.length;

      tokens.push(CommentToken(text, line, column, { type: "leading" }));

      continue;
    }

    // (;
    if (char === "(" && lookahead() === ";") {
      eatCharacter(2);

      let text = "";

      // ;)
      while (true) {
        char = input[current];

        if (char === ";" && lookahead() === ")") {
          eatToken(); // ;
          eatToken(); // )

          break;
        }

        text += char;

        if (isNewLine(char)) {
          line++;
          column = 0;
        } else {
          column++;
        }

        eatToken();
      }

      tokens.push(CommentToken(text, line, column, { type: "block" }));

      continue;
    }

    if (char === "(") {
      tokens.push(OpenParenToken(char, line, column));

      eatCharacter();
      continue;
    }

    if (char === "=") {
      tokens.push(EqualToken(char, line, column));

      eatCharacter();
      continue;
    }

    if (char === ")") {
      tokens.push(CloseParenToken(char, line, column));

      eatCharacter();
      continue;
    }

    if (isNewLine(char)) {
      line++;
      eatCharacter();
      column = 0;
      continue;
    }

    if (WHITESPACE.test(char)) {
      eatCharacter();
      continue;
    }

    if (char === "$") {
      eatCharacter();

      let value = "";

      while (idchar.test(char)) {
        value += char;
        eatCharacter();
      }

      // Shift by the length of the string
      column += value.length;

      tokens.push(IdentifierToken(value, line, column));

      continue;
    }

    if (
      NUMBERS.test(char) ||
      NUMBER_KEYWORDS.test(lookahead(3, 0)) ||
      char === "-"
    ) {
      let value = "";
      if (char === "-") {
        value += char;
        eatCharacter();
      }

      if (NUMBER_KEYWORDS.test(lookahead(3, 0))) {
        let tokenLength = 3;
        if (lookahead(4, 0) === "nan:") {
          tokenLength = 4;
        } else if (lookahead(3, 0) === "nan") {
          tokenLength = 3;
        }
        value += input.substring(current, current + tokenLength);
        eatCharacter(tokenLength);
      }

      let numberLiterals = NUMBERS;

      if (char === "0" && lookahead().toUpperCase() === "X") {
        value += "0x";
        numberLiterals = HEX_NUMBERS;
        eatCharacter(2);
      }

      while (
        numberLiterals.test(char) ||
        (lookbehind() === "p" && char === "+") ||
        (lookbehind().toUpperCase() === "E" && char === "-") ||
        (value.length > 0 && char.toUpperCase() === "E")
      ) {
        if (char === "p" && value.includes("p")) {
          throw new Error("Unexpected character `p`.");
        }

        if (char !== "_") {
          value += char;
        }
        eatCharacter();
      }

      // Shift by the length of the string
      column += value.length;

      tokens.push(NumberToken(value, line, column));

      continue;
    }

    if (char === '"') {
      let value = "";

      eatCharacter();

      while (char !== '"') {
        if (isNewLine(char)) {
          throw new Error("Unterminated string constant");
        }

        value += char;
        eatCharacter();
      }

      // Shift by the length of the string
      column += value.length;

      eatCharacter();

      tokens.push(StringToken(value, line, column));

      continue;
    }

    if (LETTERS.test(char)) {
      let value = "";

      while (LETTERS.test(char)) {
        value += char;
        eatCharacter();
      }

      // Shift by the length of the string
      column += value.length;

      /*
       * Handle MemberAccess
       */
      if (char === ".") {
        if (valtypes.indexOf(value) !== -1) {
          tokens.push(ValtypeToken(value, line, column));
        } else {
          tokens.push(NameToken(value, line, column));
        }

        value = "";
        eatCharacter();

        while (LETTERS.test(char)) {
          value += char;
          eatCharacter();
        }

        // Shift by the length of the string
        column += value.length;

        tokens.push(DotToken(".", line, column));
        tokens.push(NameToken(value, line, column));

        continue;
      }

      /*
       * Handle keywords
       */
      // $FlowIgnore
      if (typeof keywords[value] === "string") {
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

    showCodeFrame(input, line, column);

    throw new TypeError("Unknown char: " + char);
  }

  return tokens;
}

module.exports = {
  tokenize,
  tokens,
  keywords
};
