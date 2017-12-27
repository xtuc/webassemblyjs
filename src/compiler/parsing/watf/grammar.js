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

    function eatTokenOfType(type: string) {
      if (token.type !== type) {
        throw new Error(
          'Assertion error: expected token of type ' + type
          + ', given ' + token.type
        );
      }

      eatToken();
    }

    function parseMaybeSignature() {
      const params = [];
      let signatureName, result;

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

          params.push({
            id,
            valtype,
          });

          /**
           * Shorthand notation for multiple anonymous parameters
           * @see https://webassembly.github.io/spec/core/text/types.html#function-types
           * @see https://github.com/xtuc/js-webassembly-interpreter/issues/6
           */
          if (id === undefined) {
            while ( token.type === tokens.valtype ) {
              valtype = token.value;
              eatToken();

              params.push({
                valtype,
              });
            }
          }

        } else {
          throw new Error('Function param has no valtype');
        }

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
        eatToken();

        /**
         * Func export shorthand, we trait it as a syntaxic sugar.
         * A export ModuleField will be added later.
         *
         * We give the anonymous function a generated name and export it.
         */
        const id = getUniqueName();

        signatureName = id;

        state.registredExportedFuncs.push({
          name,
          id,
        });

      } else

      /**
       * Else the result result
       */
      if (isKeyword(token, keywords.result)) {
        eatToken();

        if (token.type === tokens.valtype) {

          // Already declared the result, but not supported yet by WebAssembly
          if (typeof result !== 'undefined') {
            throw new Error('Multiple return types are not supported yet');
          }

          result = token.value;
          eatToken();

        } else {
          throw new Error('Function result has no valtype');
        }
      }

      return {params, result, signatureName};
    }

    function parseListOfInstructions(acc: Array<Instruction>) {
      while (
        (token.type !== tokens.closeParen)
      ) {
        parseInstructionLine(token.loc.line, acc);
      }
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

      let funcName = token.value;
      eatToken();

      if (token.type !== tokens.openParen) {
        throw new Error('Expected a open paren, ' + token.type + ' given.');
      }

      eatToken(); // open paren

      let descr;

      if (isKeyword(token, keywords.func)) {
        eatToken(); // keyword

        const fnParams = [];
        let fnResult;

        if (token.type === tokens.identifier) {
          funcName = token.value;
          eatToken();
        }

        while (
          (token.type === tokens.openParen)
        ) {
          eatTokenOfType(tokens.openParen);

          const {params, result} = parseMaybeSignature();

          if (typeof params !== 'undefined') {
            fnParams.push(...params);
          }

          if (typeof result !== 'undefined') {
            fnResult = result;
          }

          eatTokenOfType(tokens.closeParen);
        }

        if (typeof funcName === 'undefined') {
          throw new Error('Imported function must have a name');
        }

        descr = t.funcImportDescr(
          t.identifier(funcName),
          fnParams,
          fnResult ? [fnResult] : [],
        );
      } else {
        throw new Error('Unsupported import type: ' + token.type);
      }

      eatTokenOfType(tokens.closeParen);
      eatTokenOfType(tokens.closeParen);

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
      eatTokenOfType(tokens.openParen);

      const {result} = parseMaybeSignature();

      if (typeof result === 'string') {
        eatTokenOfType(tokens.closeParen);
        eatTokenOfType(tokens.openParen);
      }

      // Empty block
      if (token.type === tokens.closeParen) {
        eatToken();

        return t.blockInstruction(label, instr, result);
      }

      parseListOfInstructions(instr);

      eatTokenOfType(tokens.closeParen);

      return t.blockInstruction(label, instr, result);
    }

    /**
     * Parses a if instruction
     *
     * Case 1:
     * label (result) then (
     *   instruction
     * )
     *
     * Case 2:
     * label then (
     *  instruction
     * )
     *
     * Case 4:
     * label then (
     *   instruction
     * ) else (
     *   instruction
     * )
     */
    function parseIf(): IfInstruction {
      let result;

      /**
       * label
       */
      if (
        token.type !== tokens.number
        && token.type !== tokens.identifier
      ) {
        throw new Error('Invaluid condition construction: missing label');
      }

      const label = token.value;
      eatToken();

      /**
       * Parse result type
       */
      if (token.type === tokens.openParen) {
        eatToken();

        if (isKeyword(token, keywords.result) === true) {
          eatToken();

          result = token.value;

          eatTokenOfType(tokens.valtype);
        }

        eatTokenOfType(tokens.closeParen);
      }

      /**
       * Then block of instruction
       */
      const consequent = [];

      if (isKeyword(token, keywords.then) === false) {
        throw new Error('Invalid condition construction: missing then');
      }

      eatToken(); // keyword

      eatTokenOfType(tokens.openParen);

      parseListOfInstructions(consequent);

      eatTokenOfType(tokens.closeParen);

      /**
       * Else block of instruction
       */
      const alternate = [];

      if (isKeyword(token, keywords.else) === true) {
        eatToken();

        eatTokenOfType(tokens.openParen);

        parseListOfInstructions(alternate);

        eatTokenOfType(tokens.closeParen);
      }

      return t.ifInstruction(label, result, consequent, alternate);
    }

    function parseBrIf(): BrIfInstruction {

      if (token.type != tokens.identifier) {
        throw new Error('Unexpected token in br_if of type: ' + token.type);
      }

      const label = t.identifier(token.value);
      eatToken();

      return t.brIfInstruction(label);
    }

    function parseBrTable(): BrTableInstruction {
      const labels = [];

      while (
        (token.type === tokens.identifier)
      ) {
        const value = token.value;
        eatToken();

        labels.push(
          t.identifier(value)
        );
      }

      const label = labels.pop();
      const tableLabels = labels;

      return t.brTableInstruction(
        tableLabels,
        label,
      );
    }

    function parseLoop(): LoopInstruction {
      let label;
      const instr = [];

      if (token.type === tokens.identifier) {
        label = token.value;
        eatToken();
      }

      /**
       * Loop instructions
       *
       * Parses a line into a instruction
       */
      eatTokenOfType(tokens.openParen);

      const {result} = parseMaybeSignature();

      if (typeof result === 'string') {
        eatTokenOfType(tokens.closeParen);
        eatTokenOfType(tokens.openParen);
      }

      // Empty block
      if (token.type === tokens.closeParen) {
        eatToken();

        return t.loopInstruction(label, result, instr);
      }

      while (
        (token.type !== tokens.closeParen)
      ) {
        parseInstructionLine(token.loc.line, instr);
      }

      eatTokenOfType(tokens.closeParen);

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

            if (token.type === tokens.identifier) {
              id = token.value;
              eatToken();
            } else {
              throw new Error('Exported function must have a name');
            }

          }

          eatToken();
        }
      }

      eatTokenOfType(tokens.closeParen);

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

      eatTokenOfType(tokens.closeParen);

      return t.module(name, moduleFields);
    }

    /**
     * Parses a line into a instruction
     */
    function parseInstructionLine(line: number, acc: Array<any>) {
      const args = [];

      function doParse() {

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
          if (token.type === tokens.identifier) {
            args.push(
              t.identifier(token.value)
            );

            eatToken();
          }

          if (token.type === tokens.number) {
            args.push(
              t.numberLiteral(token.value, object)
            );

            eatToken();
          }

          /**
           * Maybe some nested instructions
           */
          if (token.type === tokens.openParen) {
            parseListOfInstructions(args);
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
        } else if (isKeyword(token, keywords.br_table)) {
          eatToken();

          acc.push(
            parseBrTable()
          );

          return;
        } else if (isKeyword(token, keywords.br_if)) {
          eatToken();

          acc.push(
            parseBrIf()
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

          // Nested instruction
          if (token.type === tokens.openParen) {
            eatTokenOfType(tokens.openParen);

            const callBody = [];

            parseListOfInstructions(callBody);

            // Ignore call body for now since it's just in the WAST format and
            // not in the WASM production format.

            eatTokenOfType(tokens.closeParen);
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

      }

      eatTokenOfType(tokens.openParen);

      const res = doParse();

      eatTokenOfType(tokens.closeParen);

      return res;
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

      /**
       * Parses signature
       *
       * Params and return type
       */
      while (
        (token.type === tokens.openParen)
      ) {
        eatTokenOfType(tokens.openParen);

        // Check if it's the body
        if (token.type === tokens.openParen) {
          break;
        }

        // Empty body
        if (token.type === tokens.closeParen) {
          eatTokenOfType(tokens.closeParen);
          eatTokenOfType(tokens.closeParen);

          return t.func(fnName, fnParams, fnResult, fnBody);
        }

        const {params, result, signatureName} = parseMaybeSignature();

        if (typeof params !== 'undefined') {
          fnParams.push(...params);
        }

        if (typeof result !== 'undefined') {
          fnResult = result;
        }

        if (typeof signatureName !== 'undefined') {
          fnName = signatureName;
        }

        eatTokenOfType(tokens.closeParen);
      }

      parseListOfInstructions(fnBody);

      eatTokenOfType(tokens.closeParen);
      eatTokenOfType(tokens.closeParen);

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

      if (isKeyword(token, keywords.br_table)) {
        eatToken();
        return parseBrTable();
      }

      if (isKeyword(token, keywords.br_if)) {
        eatToken();
        return parseBrIf();
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
