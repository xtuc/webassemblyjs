// @flow

const {tokens, keywords} = require('./tokenizer');
const t = require('../../AST');
const {codeFrameColumns} = require('@babel/code-frame');

let inc = 0;

function hasPlugin(name: string): boolean {
  if (name !== 'wast') throw new Error('unknow plugin');

  return true;
}

// Used to have consistent tests
export function resetUniqueNameGenerator() {
  inc = 0;
}

function getUniqueName(prefix: string = 'temp'): string {
  inc++;

  return prefix + '_' + inc;
}

function isKeyword(token: Object, id: string): boolean {
  return token.type === tokens.keyword && token.value === id;
}

function showCodeFrame(source: string, loc: SourceLocation) {
  const out = codeFrameColumns(source, loc);

  process.stdout.write(out + '\n');
}

export function parse(tokensList: Array<Object>, source: string): Program {
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
        showCodeFrame(source, token.loc);

        throw new Error(
          'Assertion error: expected token of type ' + type
          + ', given ' + token.type
        );
      }

      eatToken();
    }

    function lookaheadAndCheck(...tokenTypes: Array<string>): boolean {
      const len = tokenTypes.length;

      for (let i = 0; i < len; i++) {
        const tokenAhead = tokensList[current + i];
        const expectedToken = tokenTypes[i];

        if (tokenAhead.type === 'keyword') {

          if (isKeyword(tokenAhead, expectedToken) === false) {
            return false;
          }
        } else if (expectedToken !== tokenAhead.type) {
          return false;
        }
      }

      return true;
    }

    function parseMaybeSignature() {
      const params = [];
      let signatureName, result;

      /**
       * Function params
       */
      if (isKeyword(token, keywords.param)) {
        params.push(
          ...parseFuncParam()
        );
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

    /**
     * Parse import statement
     *
     * WAST:
     *
     * import:  ( import <string> <string> <imkind> )
     * imkind:  ( func <name>? <func_sig> )
     *          ( global <name>? <global_sig> )
     *          ( table <name>? <table_sig> )
     *          ( memory <name>? <memory_sig> )
     *
     */
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

      eatTokenOfType(tokens.openParen);

      let descr;

      if (isKeyword(token, keywords.func)) {
        eatToken(); // keyword

        const fnParams = [];
        let fnResult;

        if (token.type === tokens.identifier) {
          funcName = token.value;
          eatToken();
        }

        while (token.type === tokens.openParen) {
          eatToken();

          if (lookaheadAndCheck(keywords.param) === true) {
            eatToken();

            fnParams.push(
              ...parseFuncParam()
            );
          }

          else if (lookaheadAndCheck(keywords.result) === true) {
            eatToken();

            fnResult = parseFuncResult()[0];
          }

          else {
            showCodeFrame(source, token.loc);
            throw new Error('Unexpected token in import of type: ' + token.type);
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

    /**
     * Parses a block instruction
     *
     * WAST:
     *
     * expr: ( block <name>? <block_sig> <instr>* )
     * instr: block <name>? <block_sig> <instr>* end <name>?
     * block_sig : ( result <type>* )*
     *
     */
    function parseBlock(): BlockInstruction {
      let label = t.identifier(getUniqueName('block'));
      let blockResult;
      const instr = [];

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();

          blockResult = token.value;
          eatToken();

        } else

        // Instruction
        if (
          lookaheadAndCheck(tokens.name) === true
          || lookaheadAndCheck(tokens.valtype) === true
          || token.type === 'keyword' // is any keyword
        ) {
          instr.push(
            parseFuncInstr()
          );
        }

        else {
          showCodeFrame(source, token.loc);
          throw new Error('Unexpected token in block body of type: ' + token.type);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.blockInstruction(label, instr, blockResult);
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

      const label = t.identifier(token.value);
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

    /**
     * Parses a loop instruction
     *
     * WATF:
     *
     * blockinstr :: 'loop' I:label rt:resulttype (in:instr*) 'end' id?
     *
     * WAST:
     *
     * instr     :: loop <name>? <block_sig> <instr>* end <name>?
     * expr      :: ( loop <name>? <block_sig> <instr>* )
     * block_sig :: ( result <type>* )*
     *
     */
    function parseLoop(): LoopInstruction {
      let label = t.identifier(getUniqueName('loop'));
      let blockResult;
      const instr = [];

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();

          blockResult = token.value;
          eatToken();

        } else

        // Instruction
        if (
          lookaheadAndCheck(tokens.name) === true
          || lookaheadAndCheck(tokens.valtype) === true
          || token.type === 'keyword' // is any keyword
        ) {
          instr.push(
            parseFuncInstr()
          );
        }

        else {
          showCodeFrame(source, token.loc);
          throw new Error('Unexpected token in loop body of type: ' + token.type);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.loopInstruction(label, blockResult, instr);
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
     * Parses an instruction
     *
     * WATF:
     *
     * instr      :: plaininst
     *               blockinstr
     *
     * blockinstr :: 'block' I:label rt:resulttype (in:instr*) 'end' id?
     *               'loop' I:label rt:resulttype (in:instr*) 'end' id?
     *               'if' I:label rt:resulttype (in:instr*) 'else' id? (in2:intr*) 'end' id?
     *
     * plaininst  :: 'unreachable'
     *               'nop'
     *               'br' l:labelidx
     *               'br_if' l:labelidx
     *               'br_table' l*:vec(labelidx) ln:labelidx
     *               'return'
     *               'call' x:funcidx
     *               'call_indirect' x, I:typeuse
     *
     * WAST:
     *
     * instr:
     *   <expr>
     *   <op>
     *   block <name>? <block_sig> <instr>* end <name>?
     *   loop <name>? <block_sig> <instr>* end <name>?
     *   if <name>? <block_sig> <instr>* end <name>?
     *   if <name>? <block_sig> <instr>* else <name>? <instr>* end <name>?
     *
     * expr:
     *   ( <op> )
     *   ( <op> <expr>+ )
     *   ( block <name>? <block_sig> <instr>* )
     *   ( loop <name>? <block_sig> <instr>* )
     *   ( if <name>? <block_sig> ( then <instr>* ) ( else <instr>* )? )
     *   ( if <name>? <block_sig> <expr>+ ( then <instr>* ) ( else <instr>* )? )
     *
     * op:
     *   unreachable
     *   nop
     *   br <var>
     *   br_if <var>
     *   br_table <var>+
     *   return
     *   call <var>
     *   call_indirect <func_sig>
     *   drop
     *   select
     *   get_local <var>
     *   set_local <var>
     *   tee_local <var>
     *   get_global <var>
     *   set_global <var>
     *   <type>.load((8|16|32)_<sign>)? <offset>? <align>?
     *   <type>.store(8|16|32)? <offset>? <align>?
     *   current_memory
     *   grow_memory
     *   <type>.const <value>
     *   <type>.<unop>
     *   <type>.<binop>
     *   <type>.<testop>
     *   <type>.<relop>
     *   <type>.<cvtop>/<type>
     */
    function parseFuncInstr() {
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

        if (token.type === tokens.closeParen) {

          if (typeof object === 'undefined') {
            return t.instruction(name, []);
          } else {
            return t.objectInstruction(name, object, []);
          }
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
          return t.instruction(name, args);
        } else {
          return t.objectInstruction(name, object, args);
        }
      } else

      /**
       * Else a instruction with a keyword (loop or block)
       */
      if (isKeyword(token, keywords.loop)) {
        eatToken(); // keyword

        return parseLoop();
      } else if (isKeyword(token, keywords.br_table)) {
        eatToken();

        return parseBrTable();
      } else if (isKeyword(token, keywords.br_if)) {
        eatToken();

        return parseBrIf();
      } else if (isKeyword(token, keywords.block)) {
        eatToken(); // keyword

        return parseBlock();
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

        return t.callInstruction(index);
      } else if (isKeyword(token, keywords.if)) {

        eatToken(); // Keyword

        return parseIf();
      } else {
        throw new Error('Unexpected instruction in function body: ' + token.type);
      }

    }

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

    /*
     * Parses a function
     *
     * WATF:
     *
     * functype :: ( 'func' t1:vec(param) t2:vec(result) )
     * param    :: ( 'param' id? t:valtype )
     * result   :: ( 'result' t:valtype )
     *
     * WAST:
     *
     * func     :: ( func <name>? <func_sig> <local>* <instr>* )
     *             ( func <name>? ( export <string> ) <...> )
     *             ( func <name>? ( import <string> <string> ) <func_sig> )
     * func_sig :: ( type <var> )? <param>* <result>*
     * param    :: ( param <type>* ) | ( param <name> <type> )
     * result   :: ( result <type>* )
     * local    :: ( local <type>* ) | ( local <name> <type> )
     *
     */
    function parseFunc(): Func {
      if (hasPlugin('wast') === false) {
        throw new Error('Parse func: unsupported WATF grammar');
      }

      let fnName = t.identifier(getUniqueName('func'));
      let fnResult = null;

      const fnBody = [];
      const fnParams = [];

      // name
      if (token.type === tokens.identifier) {
        fnName = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.param) === true) {
          eatToken();

          fnParams.push(
            ...parseFuncParam()
          );
        }

        else if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();

          // FIXME(sven): func result should be an array here
          // https://github.com/xtuc/js-webassembly-interpreter/issues/5
          fnResult = parseFuncResult()[0];
        }

        else if (lookaheadAndCheck(keywords.export) === true) {
          eatToken();
          parseFuncExport();
        }

        // Instruction
        else if (
          lookaheadAndCheck(tokens.name) === true
          || lookaheadAndCheck(tokens.valtype) === true
          || token.type === 'keyword' // is any keyword
        ) {
          fnBody.push(
            parseFuncInstr()
          );
        }

        else {
          showCodeFrame(source, token.loc);
          throw new Error('Unexpected token in func body of type: ' + token.type);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.func(fnName, fnParams, fnResult, fnBody);
    }

    /**
     * Parses shorthand export in func
     *
     * export :: ( export <string> )
     */
    function parseFuncExport() {

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
      const id = getUniqueName('export');

      state.registredExportedFuncs.push({
        name,
        id,
      });
    }


    /**
     * Parses a function result
     *
     * WAST:
     *
     * result :: ( result <type>* )
     */
    function parseFuncResult(): Array<string> {
      const results = [];

      if (token.type !== tokens.valtype) {
        showCodeFrame(source, token.loc);
        throw new Error('Unexpected token in func result: ' + token.type);
      }

      const valtype = token.value;
      eatToken();

      results.push(valtype);

      return results;
    }

    /**
     * Parses a function param
     *
     * WAST:
     *
     * param    :: ( param <type>* ) | ( param <name> <type> )
     */
    function parseFuncParam(): Array<{id?: Object, valtype: string}> {
      const params = [];
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

      return params;
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
        const node = parseBrTable();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.br_if)) {
        eatToken();
        const node = parseBrIf();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.func)) {
        eatToken();
        const node = parseFunc();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.module)) {
        eatToken();
        return parseModule();
      }

      if (isKeyword(token, keywords.import)) {
        eatToken();
        return parseImport();
      }

      if (isKeyword(token, keywords.block)) {
        eatToken();
        const node = parseBlock();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

    }

    showCodeFrame(source, token.loc);
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
