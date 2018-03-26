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

const tokenTypes = {
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

function tokenize(input: string) {
  let current = 0;
  let char = input[current];

  // Used by SourceLocation
  let column = 1;
  let line = 1;

  const tokens = [];

  /**
   * Creates a pushToken function for a given type
   */
  function pushToken(type: string) {
    return function(v: string | number, opts: Object = {}) {
      const startColumn = opts.startColumn || column;
      delete opts.startColumn;
      tokens.push(Token(type, v, line, startColumn, opts));
    };
  }

  /**
   * Functions to save newly encountered tokens
   */
  const pushCloseParenToken = pushToken(tokenTypes.closeParen);
  const pushOpenParenToken = pushToken(tokenTypes.openParen);
  const pushNumberToken = pushToken(tokenTypes.number);
  const pushValtypeToken = pushToken(tokenTypes.valtype);
  const pushNameToken = pushToken(tokenTypes.name);
  const pushIdentifierToken = pushToken(tokenTypes.identifier);
  const pushKeywordToken = pushToken(tokenTypes.keyword);
  const pushDotToken = pushToken(tokenTypes.dot);
  const pushStringToken = pushToken(tokenTypes.string);
  const pushCommentToken = pushToken(tokenTypes.comment);
  const pushEqualToken = pushToken(tokenTypes.equal);

  /**
   * Can be used to look at the next character(s).
   *
   * The default behavior `lookahead()` simply returns the next character without consuming it.
   * Letters are always returned in lowercase.
   *
   * @param int length How many characters to query. Default = 1
   * @param int offset How many characters to skip forward from current one. Default = 1
   *
   */
  function lookahead(length = 1, offset = 1) {
    return input
      .substring(current + offset, current + offset + length)
      .toLowerCase();
  }

  /**
   * Can be used to look at the last few character(s).
   *
   * The default behavior `lookbehind()` simply returns the last character.
   * Letters are always returned in lowercase.
   *
   * @param int length How many characters to query. Default = 1
   * @param int offset How many characters to skip back from current one. Default = 1
   *
   */
  function lookbehind(length = 1, offset = 1) {
    return input
      .substring(current - offset, current - offset + length)
      .toLowerCase();
  }

  /**
   * Advances the cursor in the input by a certain amount
   *
   * @param int amount How many characters to consume. Default = 1
   */
  function eatCharacter(amount = 1) {
    column += amount;
    current += amount;
    char = input[current];
  }

  while (current < input.length) {
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

      pushCommentToken(text, { type: "leading" });

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
          eatCharacter(2);

          break;
        }

        text += char;

        if (isNewLine(char)) {
          line++;
          column = 0;
        } else {
          column++;
        }

        eatCharacter();
      }

      pushCommentToken(text, { type: "block" });

      continue;
    }

    if (char === "(") {
      pushOpenParenToken(char);

      eatCharacter();
      continue;
    }

    if (char === "=") {
      pushEqualToken(char);

      eatCharacter();
      continue;
    }

    if (char === ")") {
      pushCloseParenToken(char);

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

      pushIdentifierToken(value);

      continue;
    }

    if (
      NUMBERS.test(char) ||
      NUMBER_KEYWORDS.test(lookahead(3, 0)) ||
      char === "-" ||
      char === "+"
    ) {
      let value = "";
      const startColumn = column;

      if (char === "-" || char === "+") {
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

      if (char === "0" && lookahead() === "x") {
        value += "0x";
        numberLiterals = HEX_NUMBERS;
        eatCharacter(2);
      }

      while (
        (char !== undefined && numberLiterals.test(char)) ||
        (lookbehind() === "p" && char === "+") ||
        (lookbehind() === "p" && char === "-") ||
        (lookbehind() === "e" && char === "+") ||
        (lookbehind() === "e" && char === "-") ||
        (value.length > 0 && (char === "e" || char === "E"))
      ) {
        if (char === "p" && value.includes("p")) {
          throw new Error('Unexpected character "p"');
        }

        if (char === "." && value.includes(".")) {
          throw new Error('Unexpected character "."');
        }

        if (
          numberLiterals !== HEX_NUMBERS &&
          char === "e" &&
          value.includes("e")
        ) {
          throw new Error('Unexpected character "e"');
        }

        value += char;
        eatCharacter();
      }

      pushNumberToken(value, { startColumn });

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

      pushStringToken(value);

      continue;
    }

    if (LETTERS.test(char)) {
      let value = "";
      const startColumn = column;

      while (LETTERS.test(char)) {
        value += char;
        eatCharacter();
      }

      /*
       * Handle MemberAccess
       */
      if (char === ".") {
        const dotStartColumn = column;
        if (valtypes.indexOf(value) !== -1) {
          pushValtypeToken(value, { startColumn });
        } else {
          pushNameToken(value);
        }
        eatCharacter();

        value = "";
        const nameStartColumn = column;

        while (LETTERS.test(char)) {
          value += char;
          eatCharacter();
        }

        pushDotToken(".", { startColumn: dotStartColumn });
        pushNameToken(value, { startColumn: nameStartColumn });

        continue;
      }

      /*
       * Handle keywords
       */
      // $FlowIgnore
      if (typeof keywords[value] === "string") {
        pushKeywordToken(value);

        // Shift by the length of the string
        column += value.length;

        continue;
      }

      /*
       * Handle types
       */
      if (valtypes.indexOf(value) !== -1) {
        pushValtypeToken(value);

        // Shift by the length of the string
        column += value.length;

        continue;
      }

      /*
       * Handle literals
       */
      pushNameToken(value);

      // Shift by the length of the string
      column += value.length;

      continue;
    }

    showCodeFrame(input, line, column);

    throw new TypeError(`Unexpected character "${char}"`);
  }

  return tokens;
}

module.exports = {
  tokenize,
  tokens: tokenTypes,
  keywords
};
