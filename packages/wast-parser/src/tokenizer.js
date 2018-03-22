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
const ALL_NUMBER_CHARS = /[0-9|A-F|a-f|_|\.|p|P|-|\+|x]/;

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

      const START = 0
      const HEX = 1
      const HEX_FRAC = 2
      const NAN_HEX = 3
      const DEC = 4
      const DEC_UNDERSCORE = 10
      const DEC_FRAC = 5
      const DEC_EXP = 1234
      const DEC_SIGNED_EXP = 21234
      const DEC_EXP_UNDERSCORE = 9000
      const STOP = 6
      const HEX_SIGNED_EXP = 7
      const HEX_EXP = 8
      const HEX_UNDERSCORE = 777
      const HEX_FRAC_UNDERSCORE = 99
      const HEX_EXP_UNDERSCORE = 88

      const stateName = {
        0: "START",
        1: "HEX",
        2: "HEX_FRAC",
        3: "NAN_HEX",
        4: "DEC",
        10: "DEC_UNDERSCORE",
        5: "DEC_FRAC",
        1234: "DEC_EXP",
        21234: "DEC_SIGNED_EXP",
        9000: "DEC_EXP_UNDERSCORE",
        6: "STOP",
        8: "HEX_EXP",
        777: "HEX_UNDERSCORE",
        99: "HEX_FRAC_UNDERSCORE",
        88: "HEX_EXP_UNDERSCORE",
      }
      /**
       * START | HEX | HEX_FRAC | NAN_HEX | DEC | DEC_FRAC | STOP
       */
      let state = START;
      const dbg = () => { throw new Error(`Unexpected character ${char} in state ${stateName[state]} on input ${input}`) }

      while (
        state !== STOP
      ) {
        if (char === undefined || (char !== '-' && char !== '+' && !NUMBER_KEYWORDS.test(lookahead(3,0)) && !ALL_NUMBER_CHARS.test(char.toLowerCase()))) {
          state = STOP
          continue
        } 

        switch (state) {
          case START: {
            // START -> START
            console.log(input, char)
            if (char === "-" || char === "+") {
              value += char;
              eatCharacter();
              break
            }

            // START -> STOP | NAN_HEX
            if (lookahead(3,0) === "nan") {
              value += "nan"
              eatCharacter(3)
              if(lookahead(3,0) === ":0x") {
                value += ":0x"
                eatCharacter(3)
                state = NAN_HEX
              } else {
                state = STOP
              }
              break
            }

            // START -> STOP
            if (lookahead(3,0) === "inf") {
              value += "inf"
              eatCharacter(3)
              state = STOP
              break
            }

            // START -> HEX
            if (lookahead(2,0) === "0x") {
              value += "0x";
              eatCharacter(2);
              state = HEX
              break
            }

            // START -> DEC
            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              state = DEC
              break
            }

            // START -> DEC_FRAC
            if (char === '.') {
              value += char
              eatCharacter();
              state = DEC_FRAC
              break
            }
            
            dbg()
          }

          case DEC_FRAC: {
            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              break
            }
          }

          case DEC: {
            // DEC -> DEC
            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              break
            }

            // DEC -> DEC_FRAC
            if (char === '.') {
              value += char
              eatCharacter()
              state = DEC_FRAC
              break
            }

            // DEC -> DEC_UNDERSCORE
            if (char === '_') {
              // Cheating the FSM a bit here, but alright
              if (/[0-9]/.test(lookbehind())) {
                value += char
                eatCharacter()
                state = DEC_UNDERSCORE
                break
              } else {
                dbg()
              }
            }

            // DEC -> DEC_SIGNED_EXP
            if (char === 'e' || char === 'E') {
              value += char
              eatCharacter()
              state = DEC_SIGNED_EXP
              break
            }

            dbg()
          }

          case DEC_SIGNED_EXP: {
            if (char === '+' || char === '-' ) {
              value += char
              eatCharacter()
              state = DEC_EXP
              break
            }

            if (/[0-9]/.test(char) ) {
              value += char
              eatCharacter()
              break
            }

            dbg()
          }

          case DEC_EXP: {
            if (/[0-9]/.test(char) ) {
              value += char
              eatCharacter()
              break
            }

            if (char === '_') {
              // Cheating the FSM a bit here, but alright
              if (/[0-9]/.test(lookbehind())) {
                value += char
                eatCharacter()
                state = DEC_EXP_UNDERSCORE
                break
              } else {
                dbg()
              }
            }

            dbg()
          }

          case DEC_EXP_UNDERSCORE: {
            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              state = DEC_EXP
              break
            } else {
              dbg()
            }

            dbg()
          }
          
          case DEC_UNDERSCORE: {
            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              state = DEC
              break
            } else {
              dbg()
            }

            dbg()
          }

          case HEX: {
            // HEX -> HEX
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char   
              eatCharacter()
              break
            }

            // HEX -> HEX_FRAC
            if (char === ".") {
              value += char
              eatCharacter()
              state = HEX_FRAC
              break
            }

            if (char === '_') {
              if (/[0-9|A-F|a-f]/.test(lookbehind())) {
                value += char
                eatCharacter()
                state = HEX_UNDERSCORE
              } else {
                dgb()
              }
              break
            }

            // HEX -> HEX_EXP
            if (char === 'p' || char === 'P') {
              value += char
              eatCharacter()
              state = HEX_SIGNED_EXP
              break
            }

            dbg()
          }

          case HEX_FRAC: {
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char   
              eatCharacter()
              break
            }

            if (char === '_') {
              if (/[0-9|A-F|a-f]/.test(lookbehind())) {
                value += char
                eatCharacter()
                state = HEX_FRAC_UNDERSCORE
              } else {
                dgb()
              }
              break
            }

            // HEX -> HEX_EXP
            if (char === 'p' || char === 'P') {
              value += char
              eatCharacter()
              state = HEX_SIGNED_EXP
              break
            }

            dbg()
          }

          case HEX_FRAC_UNDERSCORE: {
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char   
              eatCharacter()
              state = HEX_FRAC
              break
            } else {
              dbg()
            }

            dbg()
          }

          case HEX_UNDERSCORE: {
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char   
              eatCharacter()
              state = HEX
              break
            } else {
              dbg()
            }

            dbg()
          }

          case HEX_SIGNED_EXP: {

            // HEX_SIGNED_EXP -> HEX_EXP
            if (char === '+' || char === '-' || /[0-9]/.test(char)) {
              value += char
              eatCharacter()
              state = HEX_EXP
              break
            }

            dbg()
          }

          case HEX_EXP: {

            if (/[0-9]/.test(char)) {
              value += char
              eatCharacter()
              state = HEX_EXP
              break
            }

            if (char === '_') {
              if (/[0-9|A-F|a-f]/.test(lookbehind())) {
                value += char
                eatCharacter()
                state = HEX_EXP_UNDERSCORE
              } else {
                dgb()
              }
              break
            }

            dbg()
          }

          case HEX_EXP_UNDERSCORE: {
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char   
              eatCharacter()
              state = HEX_EXP
              break
            } else {
              dbg()
            }

            dbg()
          }

          case NAN_HEX: {
            if (/[0-9|A-F|a-f]/.test(char)) {
              value += char
              eatCharacter()
              state = NAN_HEX
              break
            }

            dbg()
          }

          default: {
            throw new Error('Corrupted state: ' + state )
          }

        }
      }

      if(value === "") {
        throw new Error('Unexpected character "' + char + '"')
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
