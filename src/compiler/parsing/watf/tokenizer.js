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
  import: "import",
  memory: "memory",
  table: "table",
  global: "global",
  anyfunc: "anyfunc",
  mut: "mut",
  data: "data"
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

    // ;;
    if (char === ";" && input[current + 1] === ";") {
      eatToken();
      eatToken();

      char = input[current];

      let text = "";

      while (!isNewLine(char)) {
        text += char;
        char = input[++current];

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
    if (char === "(" && input[current + 1] === ";") {
      eatToken(); // (
      eatToken(); // ;

      char = input[current];

      let text = "";

      // ;)
      while (true) {
        char = input[current];

        if (char === ";" && input[current + 1] === ")") {
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

      eatToken();
      continue;
    }

    if (char === "=") {
      tokens.push(EqualToken(char, line, column));

      eatToken();
      continue;
    }

    if (char === ")") {
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

    if (WHITESPACE.test(char)) {
      eatToken();
      continue;
    }

    if (char === "$") {
      char = input[++current];

      let value = "";

      while (idchar.test(char)) {
        value += char;
        char = input[++current];
      }

      // Shift by the length of the string
      column += value.length;

      tokens.push(IdentifierToken(value, line, column));

      continue;
    }

    if (
      NUMBERS.test(char) ||
      NUMBER_KEYWORDS.test(input.substring(current, current + 3)) ||
      char === "-"
    ) {
      let value = "";
      if (char === "-") {
        value += char;
        char = input[++current];
      }

      if (NUMBER_KEYWORDS.test(input.substring(current, current + 3))) {
        let tokenLength = 3;
        if (input.substring(current, current + 4) === "nan:") {
          tokenLength = 4;
        } else if (input.substring(current, current + 3) === "nan") {
          tokenLength = 3;
        }
        value += input.substring(current, current + tokenLength);
        char = input[(current += tokenLength)];
      }

      let numberLiterals = NUMBERS;

      if (char === "0" && input[current + 1].toUpperCase() === "X") {
        value += "0x";
        numberLiterals = HEX_NUMBERS;
        char = input[(current += 2)];
      }

      while (
        numberLiterals.test(char) ||
        (input[current - 1] === "p" && char === "+")
      ) {
        if (char !== "_") {
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
      let value = "";

      char = input[++current];

      while (char !== '"') {
        if (isNewLine(char)) {
          throw new Error("Unterminated string constant");
        }

        value += char;
        char = input[++current];
      }

      // Shift by the length of the string
      column += value.length;

      eatToken();

      tokens.push(StringToken(value, line, column));

      continue;
    }

    if (LETTERS.test(char)) {
      let value = "";

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
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
        char = input[++current];

        while (LETTERS.test(char)) {
          value += char;
          char = input[++current];
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
