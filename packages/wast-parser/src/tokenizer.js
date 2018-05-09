// @flow

import { FSM, makeTransition } from "@webassemblyjs/helper-fsm";
import { codeFrameFromSource } from "@webassemblyjs/helper-code-frame";

declare function unexpectedCharacter(): void;

/**
 * Throw an error in case the current character is invalid
 */
MACRO(
  unexpectedCharacter,
  'throw new Error(getCodeFrame(input, line, column) + `Unexpected character "${char}"`);'
);

// eslint-disable-next-line
function getCodeFrame(source: string, line: number, column: number) {
  const loc = {
    start: { line, column }
  };

  return "\n" + codeFrameFromSource(source, loc) + "\n";
}

const WHITESPACE = /\s/;
const PARENS = /\(|\)/;
const LETTERS = /[a-z0-9_/]/i;
const idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
const valtypes = ["i32", "i64", "f32", "f64"];

const NUMBERS = /[0-9|.|_]/;
const NUMBER_KEYWORDS = /nan|inf/;

function isNewLine(char: string): boolean {
  return char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13;
}

function Token(type, value, start, end, opts = {}) {
  const token = {
    type,
    value,
    loc: {
      start,
      end
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

const NUMERIC_SEPARATOR = "_";

/**
 * Build the FSM for number literals
 */
type NumberLiteralState =
  | "START"
  | "AFTER_SIGN"
  | "HEX"
  | "HEX_FRAC"
  | "NAN_HEX"
  | "DEC"
  | "DEC_EXP"
  | "DEC_FRAC"
  | "DEC_SIGNED_EXP"
  | "STOP"
  | "HEX_SIGNED_EXP"
  | "HEX_EXP";

const numberLiteralFSM: FSM<NumberLiteralState> = new FSM(
  {
    START: [
      makeTransition(/-|\+/, "AFTER_SIGN"),
      makeTransition(/nan:0x/, "NAN_HEX", { n: 6 }),
      makeTransition(/nan|inf/, "STOP", { n: 3 }),
      makeTransition(/0x/, "HEX", { n: 2 }),
      makeTransition(/[0-9]/, "DEC"),
      makeTransition(/\./, "DEC_FRAC")
    ],
    AFTER_SIGN: [
      makeTransition(/nan:0x/, "NAN_HEX", { n: 6 }),
      makeTransition(/nan|inf/, "STOP", { n: 3 }),
      makeTransition(/0x/, "HEX", { n: 2 }),
      makeTransition(/[0-9]/, "DEC"),
      makeTransition(/\./, "DEC_FRAC")
    ],
    DEC_FRAC: [
      makeTransition(/[0-9]/, "DEC_FRAC", {
        allowedSeparator: NUMERIC_SEPARATOR
      }),
      makeTransition(/e|E/, "DEC_SIGNED_EXP")
    ],
    DEC: [
      makeTransition(/[0-9]/, "DEC", { allowedSeparator: NUMERIC_SEPARATOR }),
      makeTransition(/\./, "DEC_FRAC"),
      makeTransition(/e|E/, "DEC_SIGNED_EXP")
    ],
    DEC_SIGNED_EXP: [
      makeTransition(/\+|-/, "DEC_EXP"),
      makeTransition(/[0-9]/, "DEC_EXP")
    ],
    DEC_EXP: [
      makeTransition(/[0-9]/, "DEC_EXP", {
        allowedSeparator: NUMERIC_SEPARATOR
      })
    ],
    HEX: [
      makeTransition(/[0-9|A-F|a-f]/, "HEX", {
        allowedSeparator: NUMERIC_SEPARATOR
      }),
      makeTransition(/\./, "HEX_FRAC"),
      makeTransition(/p|P/, "HEX_SIGNED_EXP")
    ],
    HEX_FRAC: [
      makeTransition(/[0-9|A-F|a-f]/, "HEX_FRAC", {
        allowedSeparator: NUMERIC_SEPARATOR
      }),
      makeTransition(/p|P|/, "HEX_SIGNED_EXP")
    ],
    HEX_SIGNED_EXP: [makeTransition(/[0-9|+|-]/, "HEX_EXP")],
    HEX_EXP: [
      makeTransition(/[0-9]/, "HEX_EXP", {
        allowedSeparator: NUMERIC_SEPARATOR
      })
    ],
    NAN_HEX: [
      makeTransition(/[0-9|A-F|a-f]/, "NAN_HEX", {
        allowedSeparator: NUMERIC_SEPARATOR
      })
    ],
    STOP: []
  },
  "START",
  "STOP"
);

function tokenize(input: string) {
  let current: number = 0;
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

      const endColumn = opts.endColumn || startColumn + String(v).length - 1;
      delete opts.endColumn;

      const start = { line, column: startColumn };
      const end = { line, column: endColumn };

      tokens.push(Token(type, v, start, end, opts));
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
   * @param {number} length How many characters to query. Default = 1
   * @param {number} offset How many characters to skip forward from current one. Default = 1
   *
   */
  function lookahead(length: number = 1, offset: number = 1): string {
    return input
      .substring(current + offset, current + offset + length)
      .toLowerCase();
  }

  /**
   * Advances the cursor in the input by a certain amount
   *
   * @param {number} amount How many characters to consume. Default = 1
   */
  function eatCharacter(amount: number = 1): void {
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

        eatCharacter();

        if (isNewLine(char)) {
          line++;
          column = 0;
        }
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

      pushIdentifierToken(value);

      continue;
    }

    if (
      NUMBERS.test(char) ||
      NUMBER_KEYWORDS.test(lookahead(3, 0)) ||
      char === "-" ||
      char === "+"
    ) {
      const startColumn = column;

      const value = numberLiteralFSM.run(input.slice(current));

      if (value === "") {
        unexpectedCharacter();
      }

      pushNumberToken(value, { startColumn });
      eatCharacter(value.length);

      if (char && !PARENS.test(char) && !WHITESPACE.test(char)) {
        unexpectedCharacter();
      }

      continue;
    }

    if (char === '"') {
      const startColumn = column;

      let value = "";

      eatCharacter(); // "

      while (char !== '"') {
        if (isNewLine(char)) {
          unexpectedCharacter();
        }

        value += char;
        eatCharacter(); // char
      }

      eatCharacter(); // "

      const endColumn = column;

      pushStringToken(value, { startColumn, endColumn });

      continue;
    }

    if (LETTERS.test(char)) {
      let value = "";
      const startColumn = column;

      while (char && LETTERS.test(char)) {
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
        pushKeywordToken(value, { startColumn });

        continue;
      }

      /*
       * Handle types
       */
      if (valtypes.indexOf(value) !== -1) {
        pushValtypeToken(value, { startColumn });

        continue;
      }

      /*
       * Handle literals
       */
      pushNameToken(value, { startColumn });

      continue;
    }

    unexpectedCharacter();
  }

  return tokens;
}

module.exports = {
  tokenize,
  tokens: tokenTypes,
  keywords
};
