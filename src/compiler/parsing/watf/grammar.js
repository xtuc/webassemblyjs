// @flow

const {tokens, keywords} = require('./tokenizer');
const t = require('../../AST');

function isKeyword(token: Object, id: string): boolean {
  return token.type === tokens.keyword && token.value === id;
}

function parse(tokensList: Array<Object>): Program {
  let current = 0;

  // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.
  function walk() {
    let token = tokensList[current];

    function eatToken() {
      token = tokensList[++current];
    }

    function parseLoop() {
      let label;
      let result;
      const instr = [];

      if (token.type === tokens.identifier) {
        label = token.value;
        eatToken();
      }

      if (token.type === tokens.valtype) {
        result = token.value;
        eatToken();
      }

      /**
       * Loop instructions
       *
       * Parses a line into a instruction
       */
      if (token.type === tokens.openParen) {
        eatToken();

        while (
          (token.type !== tokens.closeParen)
        ) {
          parseInstructionLine(token.loc.line, instr);
          eatToken();
        }
      }

      eatToken();

      return t.loopInstruction(label, result, instr);
    }

    function parseExport() {
      if (token.type !== tokens.string) {
        throw new Error('Expected string after export, got: ' + token.type);
      }

      const name = token.value;

      eatToken();

      let type;
      let id;

      if (token.type === tokens.openParen) {
        eatToken();

        while (
          (token.type !== tokens.closeParen)
        ) {

          if (isKeyword(token, keywords.func)) {
            type = 'Func';

            eatToken();
            id = parseFunc().id;
          }

          eatToken();
        }
      }

      return t.moduleExport(name, type, id);
    }

    function parseModule() {
      let name = null;
      const moduleFields = [];

      if (token.type === tokens.identifier) {
        name = token.value;
        eatToken();
      }

      while (
        (token.type !== tokens.closeParen)
      ) {
        moduleFields.push(walk());
        token = tokensList[current];
      }

      eatToken();

      return t.module(name, moduleFields);
    }

    /**
     * Parses a line into a instruction
     */
    function parseInstructionLine(line: number, acc: Array<any>) {
      const args = [];

      /**
       * A simple instruction
       */
      if (token.type === tokens.name || token.type === tokens.valtype) {
        let name = token.value;

        eatToken();

        if (token.type === tokens.dot) {
          name += '.';
          eatToken();

          if (token.type !== tokens.name) {
            throw new TypeError('Unknown token: ' + token.type + ', name expected');
          }

          name += token.value;
          eatToken();
        }

        if (token.loc.line !== line || token.type === tokens.closeParen) {
          acc.push(t.instruction(name, []));
          return;
        }

        /**
         * Handle arguments
         *
         * Currently only one argument is allowed
         */
        if (token.type === tokens.identifier || token.type === tokens.number) {
          args.push(token.value);

          eatToken();
        }

        /**
         * Argument is a new instruction
         *
         * Currently only one allowed
         */
        if (token.type === tokens.openParen) {
          eatToken(); // open paren

          parseInstructionLine(token.loc.line, args);

          eatToken(); // close paren
        }

        acc.push(t.instruction(name, args));

        return;
      } else

      /**
       * Else a instruction with a keyword (loop or block)
       */
      if (isKeyword(token, keywords.loop)) {
        eatToken(); // keyword

        acc.push(
          parseLoop()
        );

        return;
      } else {
        throw new Error('Unexpected instruction in function body: ' + token.type);
      }

      throw new Error('Unexpected trailing tokens for instructions: ' + token.type);
    }

    function parseFunc() {
      let fnName = null;
      let fnResult = null;

      const fnBody = [];
      const fnParams = [];

      if (token.type === tokens.identifier) {
        fnName = token.value;
        eatToken();
      }

      function parseMaybeInstruction() {
        if (token.type === tokens.closeParen) {
          return;
        }

        return parseInstructionLine(token.loc.line, fnBody);
      }

      function parseMaybeSignature() {

        /**
         * Function params
         */
        if (isKeyword(token, keywords.param)) {
          eatToken();

          let id;
          let valtype;

          if (token.type === tokens.identifier) {
            id = token.value;
            eatToken();
          }

          if (token.type === tokens.valtype) {
            valtype = token.value;

            eatToken();
          } else {
            throw new Error('Function param has no valtype');
          }

          fnParams.push({
            id,
            valtype,
          });
        } else

        /**
         * Else the result result
         */
        if (isKeyword(token, keywords.result)) {
          eatToken();

          if (token.type === tokens.valtype) {

            // Already declared the result, but not supported yet by WebAssembly
            if (fnResult !== null) {
              throw new Error('Multiple return types are not supported yet');
            }

            fnResult = token.value;

            eatToken();
          } else {
            throw new Error('Function result has no valtype');
          }
        }

      }

      /**
       * Parses signature
       *
       * Params and return type
       */
      while (
        (token.type === tokens.openParen)
      ) {
        eatToken(); // open paren

        parseMaybeSignature();
        parseMaybeInstruction();

        eatToken(); // close parens
      }

      /**
       * Function body
       *
       * One instruction per line, parse the current one
       */
      while (
        token.type !== tokens.closeParen
      ) {
        parseInstructionLine(token.loc.line, fnBody);
      }

      eatToken();

      return t.func(fnName, fnParams, fnResult, fnBody);
    }

    if (token.type === tokens.openParen) {

      eatToken();

      if (isKeyword(token, keywords.export)) {
        eatToken();
        return parseExport();
      }

      if (isKeyword(token, keywords.loop)) {
        eatToken();
        return parseLoop();
      }

      if (isKeyword(token, keywords.func)) {
        eatToken();
        return parseFunc();
      }

      if (isKeyword(token, keywords.module)) {
        eatToken();
        return parseModule();
      }
    }

    throw new TypeError('Unknown token: ' + token.type);
  }

  // Now, we're going to create our AST which will have a root which is a
  // `Program` node.
  const body = [];

  while (current < tokensList.length) {
    body.push(
      walk() // to statement
    );
  }

  // At the end of our parser we'll return the AST.
  return t.program(body);
}

module.exports = {parse};
