// @flow

const {tokens, keywords} = require('./tokenizer');
const t = require('../../AST');

let inc = 0;

function getUniqueName(prefix: string = 'temp'): string {
  inc++;

  return prefix + '_' + inc;
}

function isKeyword(token: Object, id: string): boolean {
  return token.type === tokens.keyword && token.value === id;
}

function parse(tokensList: Array<Object>): Program {
  let current = 0;

  const state = {
    registredExportedFuncs: [],
  };

  // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.
  function walk(): Node {
    let token = tokensList[current];

    function eatToken() {
      token = tokensList[++current];
    }

    function parseListOfInstructions(acc: Array<Instruction>) {
      if (token.type === tokens.openParen) {
        eatToken();
      }

      while (
        (token.type !== tokens.closeParen)
      ) {
        if (token.type === tokens.openParen) {
          eatToken();
        }

        parseInstructionLine(token.loc.line, acc);

        eatToken();
      }

      eatToken(); // Closing paren
    }

    function parseImport(): ModuleImport {

      if (token.type !== tokens.string) {
        throw new Error('Expected a string, ' + token.type + ' given.');
      }

      const moduleName = token.value;
      eatToken();

      if (token.type !== tokens.string) {
        throw new Error('Expected a string, ' + token.type + ' given.');
      }

      const funcName = token.value;
      eatToken();

      if (token.type !== tokens.openParen) {
        throw new Error('Expected a open paren, ' + token.type + ' given.');
      }

      eatToken(); // open paren

      let descr;

      while (
        (token.type !== tokens.closeParen)
      ) {

        if (isKeyword(token, keywords.func)) {
          eatToken();

          const fn = parseFunc();

          if (typeof fn.id === 'undefined') {
            throw new Error('Imported function must have a name');
          }

          descr = t.funcImportDescr(
            t.identifier(fn.id),
            fn.params,
            fn.result ? [fn.result] : [],
          );
        }

        eatToken();
      }

      return t.moduleImport(moduleName, funcName, descr);
    }

    function parseBlock(): BlockInstruction {
      let label = getUniqueName();
      const instr = [];

      if (token.type === tokens.identifier) {
        label = token.value;
        eatToken();
      }

      /**
       * Block instructions
       *
       * Parses a line into a instruction
       */
      if (token.type === tokens.openParen) {
        eatToken();

        parseListOfInstructions(instr);
      }

      return t.blockInstruction(label, instr);
    }

    function parseIf(): IfInstruction {
      const consequent = [];
      const alternate = [];

      let result;

      /**
       * Test instruction
       */
      if (token.type !== tokens.openParen) {
        throw new Error('Invalid if construction: missing test or signature');
      }

      eatToken(); // Opening paren

      const acc = [];

      /**
       * Parse result type if provided
       */
      if (isKeyword(token, keywords.result)) {
        eatToken();

        result = token.value;

        eatToken(); // Valtype
        eatToken(); // Closing paren

        eatToken(); // Opening paren
      }

      parseInstructionLine(token.loc.line, acc);

      const test = acc.pop();

      eatToken(); // Closing paren

      eatToken(); // Opening paren

      /**
       * then
       */
      if (!isKeyword(token, keywords.then)) {
        throw new Error('Invalid if construction: missing then');
      }

      eatToken(); // then keyword

      parseListOfInstructions(consequent);

      /**
       * parse else if found
       */

      if (token.type === tokens.openParen) {
        eatToken();

        if (isKeyword(token, keywords.else)) {
          eatToken();

          parseListOfInstructions(alternate);
        }
      }

      return t.ifInstruction(test, result, consequent, alternate);
    }

    function parseLoop(): LoopInstruction {
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

    function parseExport(): ModuleExport {
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

    function parseModule(): Module {
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

        if (state.registredExportedFuncs.length > 0) {

          state.registredExportedFuncs.forEach((decl) => {
            moduleFields.push(
              t.moduleExport(decl.name, 'Func', decl.id)
            );
          });

          state.registredExportedFuncs = [];
        }

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
        let object;

        eatToken();

        if (token.type === tokens.dot) {
          object = name;
          eatToken();

          if (token.type !== tokens.name) {
            throw new TypeError('Unknown token: ' + token.type + ', name expected');
          }

          name = token.value;
          eatToken();
        }

        if (token.loc.line !== line || token.type === tokens.closeParen) {
          if (typeof object === 'undefined') {
            acc.push(t.instruction(name, []));
          } else {
            acc.push(t.objectInstruction(name, object, []));
          }

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

        if (typeof object === 'undefined') {
          acc.push(t.instruction(name, args));
        } else {
          acc.push(t.objectInstruction(name, object, args));
        }

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
      } else if (isKeyword(token, keywords.block)) {

        eatToken(); // keyword

        acc.push(
          parseBlock()
        );

        return;

      } else if (isKeyword(token, keywords.call)) {
        eatToken(); // keyword

        let index;

        if (token.type === tokens.identifier) {
          index = t.identifier(token.value);
          eatToken();
        } else if (token.type === tokens.number) {
          index = t.numberLiteral(token.value);
          eatToken();
        }

        if (typeof index === 'undefined') {
          throw new Error('Missing argument in call instruciton');
        }

        acc.push(
          t.callInstruction(index)
        );

        return;

      } else if (isKeyword(token, keywords.if)) {

        eatToken(); // Keyword

        acc.push(
          parseIf()
        );

        return;

      } else {
        throw new Error('Unexpected instruction in function body: ' + token.type);
      }

      // $FlowIgnore
      throw new Error('Unexpected trailing tokens for instructions: ' + token.type);
    }

    function parseFunc(): Func {
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
         * Else an export
         */
        if (isKeyword(token, keywords.export)) {
          eatToken();

          if (token.type !== tokens.string) {
            throw new Error('Function export expected a string, ' + token.type + ' given');
          }

          const name = token.value;

          /**
           * Func export shorthand, we trait it as a syntaxic sugar.
           * A export ModuleField will be added later.
           *
           * We give the anonymous function a generated name and export it.
           */
          const id = getUniqueName();

          fnName = id;

          state.registredExportedFuncs.push({
            name,
            id,
          });

          eatToken(); // Closing paren
        }

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

      if (isKeyword(token, keywords.import)) {
        eatToken();
        return parseImport();
      }
    }

    throw new TypeError('Unknown token: ' + token.type);
  }

  const body = [];

  while (current < tokensList.length) {
    body.push(
      walk()
    );
  }

  return t.program(body);
}

module.exports = {parse};
