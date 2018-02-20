// @flow
import { parse32I } from "./number-literals";
import { parseString } from "./string-literals";

const { tokens, keywords } = require("./tokenizer");
const t = require("../../AST");
const { codeFrameColumns } = require("@babel/code-frame");

type AllArgs = {
  args: Array<Expression>,
  namedArgs: Object
};

function hasPlugin(name: string): boolean {
  if (name !== "wast") throw new Error("unknow plugin");

  return true;
}

function isKeyword(token: Object, id: string): boolean {
  return token.type === tokens.keyword && token.value === id;
}

function showCodeFrame(source: string, loc: SourceLocation) {
  const out = codeFrameColumns(source, loc);

  process.stdout.write(out + "\n");
}

function tokenToString(token: Object): string {
  if (token.type === "keyword") {
    return token.value;
  }

  return token.type;
}

type ParserState = {
  registredExportedElements: Array<{
    type: ExportDescr,
    name: string,
    id: Index
  }>,
  registredImportedElements: Array<{
    module: string,
    name: string,
    descr: ImportDescr
  }>
};

export function parse(tokensList: Array<Object>, source: string): Program {
  let current = 0;
  let inc = 0;

  function getUniqueName(prefix: string = "temp"): string {
    inc++;

    return prefix + "_" + inc;
  }

  const state: ParserState = {
    registredExportedElements: [],
    registredImportedElements: []
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
          "Assertion error: expected token of type " +
            type +
            ", given " +
            token.type
        );
      }

      eatToken();
    }

    function lookaheadAndCheck(...tokenTypes: Array<string>): boolean {
      const len = tokenTypes.length;

      for (let i = 0; i < len; i++) {
        const tokenAhead = tokensList[current + i];
        const expectedToken = tokenTypes[i];

        if (tokenAhead.type === "keyword") {
          if (isKeyword(tokenAhead, expectedToken) === false) {
            return false;
          }
        } else if (expectedToken !== tokenAhead.type) {
          return false;
        }
      }

      return true;
    }

    // TODO(sven): there is probably a better way to do this
    // can refactor it if it get out of hands
    function maybeIgnoreComment() {
      if (token.type === tokens.comment) {
        eatToken();
      }
    }

    function parseListOfInstructions(acc: Array<Instruction>) {
      while (token.type === tokens.openParen) {
        eatToken();

        acc.push(parseFuncInstr());
      }
    }

    /**
     * Parses a memory instruction
     *
     * WAST:
     *
     * memory:  ( memory <name>? <memory_sig> )
     *          ( memory <name>? ( export <string> ) <...> )
     *          ( memory <name>? ( import <string> <string> ) <memory_sig> )
     *          ( memory <name>? ( export <string> )* ( data <string>* )
     * memory_sig: <nat> <nat>?
     *
     */
    function parseMemory(): Memory {
      let id = t.identifier(getUniqueName("memory"));

      if (token.type === tokens.string || token.type === tokens.identifier) {
        id = t.identifier(token.value);

        eatToken();
      }

      /**
       * Maybe export
       */
      if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
        eatToken(); // (
        eatToken(); // export

        if (token.type !== tokens.string) {
          showCodeFrame(source, token.loc);
          throw new Error("Expected string in export, given " + token.type);
        }

        const name = token.value;
        eatToken();

        state.registredExportedElements.push({
          type: "Memory",
          name,
          id
        });

        eatTokenOfType(tokens.closeParen);
      }

      /**
       * Memory signature
       */
      if (token.type !== tokens.number) {
        showCodeFrame(source, token.loc);
        throw new Error(
          "Unexpected token in memory instruction: " + token.type
        );
      }

      const limits = t.limits(parse32I(token.value));
      eatToken();

      if (token.type === tokens.number) {
        limits.max = parse32I(token.value);
        eatToken();
      }

      return t.memory(limits, id);
    }

    /**
     * Parses a data section
     * https://webassembly.github.io/spec/core/text/modules.html#data-segments
     *
     * WAST:
     *
     * data:  ( data <index>? <offset> <string> )
     */
    function parseData(): Data {
      // optional memory index
      let memidx = 0;
      if (token.type === tokens.number) {
        memidx = token.value;
        eatTokenOfType(tokens.number); // .
      }

      eatTokenOfType(tokens.openParen);

      let offset: Instruction;
      if (token.type === tokens.valtype) {
        eatTokenOfType(tokens.valtype); // i32
        eatTokenOfType(tokens.dot); // .

        if (token.value !== "const") {
          throw new Error("constant expression required");
        }
        eatTokenOfType(tokens.name); // const

        const numberLiteral = t.numberLiteral(token.value, "i32");
        offset = t.instruction("const", [numberLiteral]);
        eatToken();

        eatTokenOfType(tokens.closeParen);
      } else {
        eatTokenOfType(tokens.name); // get_global

        const numberLiteral = t.numberLiteral(token.value, "i32");
        offset = t.instruction("get_global", [numberLiteral]);
        eatToken();

        eatTokenOfType(tokens.closeParen);
      }

      const byteArray = parseString(token.value);
      eatToken(); // "string"

      return t.data(t.memIndexLiteral(memidx), offset, t.byteArray(byteArray));
    }

    /**
     * Parses a table instruction
     *
     * WAST:
     *
     * table: ( table <name>? <table_sig> )
     *        ( table <name>? ( export <string> ) <...> )
     *        ( table <name>? ( import <string> <string> ) <table_sig> )
     *        ( table <name>? ( export <string> )* <elem_type> ( elem <var>* ) )
     *
     * table_sig:  <nat> <nat>? <elem_type>
     */
    function parseTable(): Table {
      let name = t.identifier(getUniqueName());

      let limit = t.limits(0);
      const elemType = "anyfunc";

      if (token.type === tokens.string || token.type === tokens.identifier) {
        name = t.identifier(token.value);
        eatToken();
      }

      /**
       * Maybe export
       */
      if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
        eatToken(); // (
        eatToken(); // export

        if (token.type !== tokens.string) {
          showCodeFrame(source, token.loc);
          throw new Error("Expected string in export, given " + token.type);
        }

        const exportName = token.value;
        eatToken();

        state.registredExportedElements.push({
          type: "Table",
          name: exportName,
          id: name
        });

        eatTokenOfType(tokens.closeParen);
      }

      /**
       * Table signature
       */
      if (token.type === tokens.number) {
        const min = token.value;
        eatToken();

        if (token.type === tokens.number) {
          const max = token.value;
          eatToken();

          limit = t.limits(min, max);
        } else {
          limit = t.limits(min);
        }

        if (!isKeyword(token, keywords.anyfunc)) {
          showCodeFrame(source, token.loc);
          throw new Error(
            "Unsupported elem_type, expected anyfunc, given " + token.type
          );
        }

        eatToken();
      }

      return t.table(elemType, limit, name);
    }

    /**
     * Parses an import statement
     *
     * WAST:
     *
     * import:  ( import <string> <string> <imkind> )
     * imkind:  ( func <name>? <func_sig> )
     *          ( global <name>? <global_sig> )
     *          ( table <name>? <table_sig> )
     *          ( memory <name>? <memory_sig> )
     *
     * global_sig: <type> | ( mut <type> )
     */
    function parseImport(): ModuleImport {
      if (token.type !== tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      const moduleName = token.value;
      eatToken();

      if (token.type !== tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      let funcName = token.value;
      eatToken();

      eatTokenOfType(tokens.openParen);

      let descr;

      if (isKeyword(token, keywords.func)) {
        eatToken(); // keyword

        const fnParams = [];
        const fnResult = [];

        if (token.type === tokens.identifier) {
          funcName = token.value;
          eatToken();
        }

        while (token.type === tokens.openParen) {
          eatToken();

          if (lookaheadAndCheck(keywords.param) === true) {
            eatToken();

            fnParams.push(...parseFuncParam());
          } else if (lookaheadAndCheck(keywords.result) === true) {
            eatToken();

            fnResult.push(...parseFuncResult());
          } else {
            showCodeFrame(source, token.loc);
            throw new Error(
              "Unexpected token in import of type: " + token.type
            );
          }

          eatTokenOfType(tokens.closeParen);
        }

        if (typeof funcName === "undefined") {
          throw new Error("Imported function must have a name");
        }

        descr = t.funcImportDescr(t.identifier(funcName), fnParams, fnResult);
      } else if (isKeyword(token, keywords.global)) {
        eatToken(); // keyword

        if (token.type === tokens.openParen) {
          eatToken(); // (
          eatTokenOfType(tokens.keyword); // mut keyword

          const valtype = token.value;
          eatToken();

          descr = t.globalImportDescr(valtype, "var");

          eatTokenOfType(tokens.closeParen);
        } else {
          const valtype = token.value;
          eatTokenOfType(tokens.valtype);

          descr = t.globalImportDescr(valtype, "const");
        }
      } else {
        throw new Error("Unsupported import type: " + tokenToString(token));
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
      let label = t.identifier(getUniqueName("block"));
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
        } else if (
          lookaheadAndCheck(tokens.name) === true ||
          lookaheadAndCheck(tokens.valtype) === true ||
          token.type === "keyword" // is any keyword
        ) {
          // Instruction
          instr.push(parseFuncInstr());
        } else {
          showCodeFrame(source, token.loc);
          throw new Error(
            "Unexpected token in block body of type: " + token.type
          );
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.blockInstruction(label, instr, blockResult);
    }

    /**
     * Parses a if instruction
     *
     * WAST:
     *
     * expr:
     * ( if <name>? <block_sig> ( then <instr>* ) ( else <instr>* )? )
     * ( if <name>? <block_sig> <expr>+ ( then <instr>* ) ( else <instr>* )? )
     *
     * instr:
     * if <name>? <block_sig> <instr>* end <name>?
     * if <name>? <block_sig> <instr>* else <name>? <instr>* end <name>?
     *
     * block_sig : ( result <type>* )*
     *
     */
    function parseIf(): IfInstruction {
      let blockResult;
      let label = t.identifier(getUniqueName("if"));

      const testInstrs = [];
      const consequent = [];
      const alternate = [];

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken(); // (

        /**
         * Block signature
         */
        if (isKeyword(token, keywords.result) === true) {
          eatToken();

          blockResult = token.value;
          eatTokenOfType(tokens.valtype);

          eatTokenOfType(tokens.closeParen);

          continue;
        }

        /**
         * Then
         */
        if (isKeyword(token, keywords.then) === true) {
          eatToken(); // then

          while (token.type === tokens.openParen) {
            eatToken();

            // Instruction
            if (
              lookaheadAndCheck(tokens.name) === true ||
              lookaheadAndCheck(tokens.valtype) === true ||
              token.type === "keyword" // is any keyword
            ) {
              consequent.push(parseFuncInstr());
            } else {
              showCodeFrame(source, token.loc);
              throw new Error(
                "Unexpected token in consequent body of type: " + token.type
              );
            }

            eatTokenOfType(tokens.closeParen);
          }

          eatTokenOfType(tokens.closeParen);

          continue;
        }

        /**
         * Alternate
         */
        if (isKeyword(token, keywords.else)) {
          eatToken(); // else

          while (token.type === tokens.openParen) {
            eatToken();

            // Instruction
            if (
              lookaheadAndCheck(tokens.name) === true ||
              lookaheadAndCheck(tokens.valtype) === true ||
              token.type === "keyword" // is any keyword
            ) {
              alternate.push(parseFuncInstr());
            } else {
              showCodeFrame(source, token.loc);
              throw new Error(
                "Unexpected token in alternate body of type: " + token.type
              );
            }

            eatTokenOfType(tokens.closeParen);
          }

          eatTokenOfType(tokens.closeParen);

          continue;
        }

        /**
         * Test instruction
         */
        if (
          lookaheadAndCheck(tokens.name) === true ||
          lookaheadAndCheck(tokens.valtype) === true ||
          token.type === "keyword" // is any keyword
        ) {
          testInstrs.push(parseFuncInstr());

          eatTokenOfType(tokens.closeParen);

          continue;
        }
      }

      return t.ifInstruction(
        label,
        blockResult,
        testInstrs,
        consequent,
        alternate
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
      let label = t.identifier(getUniqueName("loop"));
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
        } else if (
          lookaheadAndCheck(tokens.name) === true ||
          lookaheadAndCheck(tokens.valtype) === true ||
          token.type === "keyword" // is any keyword
        ) {
          // Instruction
          instr.push(parseFuncInstr());
        } else {
          showCodeFrame(source, token.loc);
          throw new Error(
            "Unexpected token in loop body of type: " + token.type
          );
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.loopInstruction(label, blockResult, instr);
    }

    /**
     * Parses an export instruction
     *
     * WATF:
     *
     * export:  ( export <string> <exkind> )
     * exkind:  ( func <var> )
     *          ( global <var> )
     *          ( table <var> )
     *          ( memory <var> )
     * var:    <nat> | <name>
     *
     */
    function parseExport(): ModuleExport {
      if (token.type !== tokens.string) {
        throw new Error("Expected string after export, got: " + token.type);
      }

      const name = token.value;
      eatToken();

      let type = "";
      let index;

      if (token.type === tokens.openParen) {
        eatToken();

        while (token.type !== tokens.closeParen) {
          if (isKeyword(token, keywords.func)) {
            type = "Func";

            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.table)) {
            type = "Table";

            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.global)) {
            type = "Global";

            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.memory)) {
            type = "Memory";

            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          eatToken();
        }
      }

      if (type === "") {
        throw new Error("Unknown export type");
      }

      if (index === undefined) {
        throw new Error("Exported function must have a name");
      }

      eatTokenOfType(tokens.closeParen);

      return t.moduleExport(name, type, index);
    }

    function parseModule(): Module {
      let name = null;
      let isBinary = false;
      let isQuote = false;
      const moduleFields = [];

      if (token.type === tokens.identifier) {
        name = token.value;
        eatToken();
      }

      if (
        hasPlugin("wast") &&
        token.type === tokens.name &&
        token.value === "binary"
      ) {
        eatToken();

        isBinary = true;
      }

      if (
        hasPlugin("wast") &&
        token.type === tokens.name &&
        token.value === "quote"
      ) {
        eatToken();

        isQuote = true;
      }

      if (isBinary === true) {
        const blob = [];

        while (token.type === tokens.string) {
          blob.push(token.value);
          eatToken();

          maybeIgnoreComment();
        }

        eatTokenOfType(tokens.closeParen);

        return t.binaryModule(name, blob);
      }

      if (isQuote === true) {
        const string = [];

        while (token.type === tokens.string) {
          string.push(token.value);
          eatToken();
        }

        eatTokenOfType(tokens.closeParen);

        return t.quoteModule(name, string);
      }

      while (token.type !== tokens.closeParen) {
        moduleFields.push(walk());

        if (state.registredExportedElements.length > 0) {
          state.registredExportedElements.forEach(decl => {
            moduleFields.push(t.moduleExport(decl.name, decl.type, decl.id));
          });

          state.registredExportedElements = [];
        }

        if (state.registredImportedElements.length > 0) {
          state.registredImportedElements.forEach(decl => {
            moduleFields.push(
              t.moduleImport(decl.module, decl.name, decl.descr)
            );
          });

          state.registredImportedElements = [];
        }

        token = tokensList[current];
      }

      eatTokenOfType(tokens.closeParen);

      return t.module(name, moduleFields);
    }

    /**
     * Parses the arguments of an instruction
     */
    function parseFuncInstrArguments(signature: ?SignatureMap): AllArgs {
      const args: Array<Expression> = [];
      const namedArgs = {};
      let signaturePtr = 0;

      while (token.type === tokens.name) {
        const key = token.value;
        eatToken();

        eatTokenOfType(tokens.equal);

        let value: any;

        if (token.type === tokens.number) {
          value = t.numberLiteral(token.value);
        } else {
          throw new Error("Unexpected type for argument: " + token.type);
        }

        namedArgs[key] = value;

        eatToken();
      }

      while (token.type !== tokens.closeParen) {
        if (token.type === tokens.identifier) {
          args.push(t.identifier(token.value));

          eatToken();
        }

        // Handle locals
        if (token.type === tokens.valtype) {
          args.push(t.valtype(token.value));

          eatToken();
        }

        if (token.type === tokens.string) {
          args.push(t.stringLiteral(token.value));

          eatToken();
        }

        if (token.type === tokens.number) {
          args.push(
            // TODO(sven): refactor the type signature handling
            // https://github.com/xtuc/js-webassembly-interpreter/pull/129 is a good start
            // $FlowIgnore
            t.numberLiteral(token.value, signature[signaturePtr++] || "f64")
          );

          eatToken();
        }

        /**
         * Maybe some nested instructions
         */
        if (token.type === tokens.openParen) {
          eatToken();

          // Instruction
          if (
            lookaheadAndCheck(tokens.name) === true ||
            lookaheadAndCheck(tokens.valtype) === true ||
            token.type === "keyword" // is any keyword
          ) {
            args.push(parseFuncInstr());
          } else {
            showCodeFrame(source, token.loc);
            throw new Error(
              "Unexpected token in nested instruction of type: " + token.type
            );
          }

          if (token.type === tokens.closeParen) {
            eatToken();
          }
        }
      }

      return { args, namedArgs };
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
    function parseFuncInstr(): Instruction {
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
            throw new TypeError(
              "Unknown token: " + token.type + ", name expected"
            );
          }

          name = token.value;
          eatToken();
        }

        if (token.type === tokens.closeParen) {
          if (typeof object === "undefined") {
            return t.instruction(name);
          } else {
            return t.objectInstruction(name, object, []);
          }
        }

        const signature = t.signature(object || "", name);

        const { args, namedArgs } = parseFuncInstrArguments(signature);

        if (typeof object === "undefined") {
          return t.instruction(name, args, namedArgs);
        } else {
          return t.objectInstruction(name, object, args, namedArgs);
        }
      } else if (isKeyword(token, keywords.loop)) {
        /**
         * Else a instruction with a keyword (loop or block)
         */
        eatToken(); // keyword

        return parseLoop();
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
          index = t.indexLiteral(token.value);
          eatToken();
        }

        // Nested instruction
        if (token.type === tokens.openParen) {
          const callBody = [];

          parseListOfInstructions(callBody);

          // Ignore call body for now since it's just in the WAST format and
          // not in the WASM production format.
          eatTokenOfType(tokens.closeParen);
        }

        if (typeof index === "undefined") {
          throw new Error("Missing argument in call instruciton");
        }

        return t.callInstruction(index);
      } else if (isKeyword(token, keywords.if)) {
        eatToken(); // Keyword

        return parseIf();
      } else if (isKeyword(token, keywords.module) && hasPlugin("wast")) {
        eatToken();

        // In WAST you can have a module as an instruction's argument
        // we will cast it into a instruction to not break the flow
        // $FlowIgnore
        const module: Instruction = parseModule();

        return module;
      } else {
        showCodeFrame(source, token.loc);
        throw new Error(
          "Unexpected instruction in function body: " + token.type
        );
      }
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
      if (hasPlugin("wast") === false) {
        throw new Error("Parse func: unsupported WATF grammar");
      }

      let fnName = t.identifier(getUniqueName("func"));
      const fnBody = [];
      const fnParams: Array<FuncParam> = [];
      const fnResult: Array<Valtype> = [];

      // name
      if (token.type === tokens.identifier) {
        fnName = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.param) === true) {
          eatToken();

          fnParams.push(...parseFuncParam());
        } else if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();

          fnResult.push(...parseFuncResult());
        } else if (lookaheadAndCheck(keywords.export) === true) {
          eatToken();
          parseFuncExport(fnName);
        } else if (
          lookaheadAndCheck(tokens.name) === true ||
          lookaheadAndCheck(tokens.valtype) === true ||
          token.type === "keyword" // is any keyword
        ) {
          // Instruction
          fnBody.push(parseFuncInstr());
        } else {
          showCodeFrame(source, token.loc);
          throw new Error(
            "Unexpected token in func body of type: " + token.type
          );
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
    function parseFuncExport(funcId: Identifier) {
      if (token.type !== tokens.string) {
        throw new Error(
          "Function export expected a string, " + token.type + " given"
        );
      }

      const name = token.value;
      eatToken();

      /**
       * Func export shorthand, we trait it as a syntaxic sugar.
       * A export ModuleField will be added later.
       *
       * We give the anonymous function a generated name and export it.
       */
      const id = t.identifier(funcId.value);

      state.registredExportedElements.push({
        type: "Func",
        name,
        id
      });
    }

    /**
     * Parses a function result
     *
     * WAST:
     *
     * result :: ( result <type>* )
     */
    function parseFuncResult(): Array<Valtype> {
      const results = [];

      if (token.type !== tokens.valtype) {
        showCodeFrame(source, token.loc);
        throw new Error("Unexpected token in func result: " + token.type);
      }

      const valtype = token.value;
      eatToken();

      results.push(valtype);

      return results;
    }

    /**
     * Parses a global instruction
     *
     * WAST:
     *
     * global:  ( global <name>? <global_sig> <instr>* )
     *          ( global <name>? ( export <string> ) <...> )
     *          ( global <name>? ( import <string> <string> ) <global_sig> )
     *
     * global_sig: <type> | ( mut <type> )
     *
     */
    function parseGlobal(): Global {
      let name = t.identifier(getUniqueName("global"));
      let type;

      // Keep informations in case of a shorthand import
      let importing = null;

      maybeIgnoreComment();

      if (token.type === tokens.identifier) {
        name = t.identifier(token.value);
        eatToken();
      }

      /**
       * maybe export
       */
      if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
        eatToken(); // (
        eatToken(); // export

        const exportName = token.value;
        eatTokenOfType(tokens.string);

        state.registredExportedElements.push({
          type: "Global",
          name: exportName,
          id: name
        });

        eatTokenOfType(tokens.closeParen);
      }

      /**
       * maybe import
       */
      if (lookaheadAndCheck(tokens.openParen, keywords.import)) {
        eatToken(); // (
        eatToken(); // import

        const moduleName = token.value;
        eatTokenOfType(tokens.string);

        const name = token.value;
        eatTokenOfType(tokens.string);

        importing = {
          module: moduleName,
          name,
          descr: undefined
        };

        eatTokenOfType(tokens.closeParen);
      }

      /**
       * global_sig
       */
      if (token.type === tokens.valtype) {
        type = t.globalImportDescr(token.value, "const");
        eatToken();
      } else if (token.type === tokens.openParen) {
        eatToken(); // (

        if (isKeyword(token, keywords.mut) === false) {
          showCodeFrame(source, token.loc);
          throw new Error("Unsupported global type, expected mut");
        }

        eatToken(); // mut

        type = t.globalType(token.value, "var");
        eatToken();

        eatTokenOfType(tokens.closeParen);
      }

      if (type === undefined) {
        showCodeFrame(source, token.loc);
        throw new TypeError("Could not determine global type");
      }

      if (importing != null) {
        importing.descr = type;

        // $FlowIgnore: the type is correct but Flow doesn't like the mutation above
        state.registredImportedElements.push(importing);
      }

      maybeIgnoreComment();

      const init = [];

      /**
       * instr*
       */
      while (token.type === tokens.openParen) {
        eatToken();

        init.push(parseFuncInstr());
        eatTokenOfType(tokens.closeParen);
      }

      return t.global(type, init, name);
    }

    /**
     * Parses a function param
     *
     * WAST:
     *
     * param    :: ( param <type>* ) | ( param <name> <type> )
     */
    function parseFuncParam(): Array<FuncParam> {
      const params: Array<FuncParam> = [];
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
          valtype
        });

        /**
         * Shorthand notation for multiple anonymous parameters
         * @see https://webassembly.github.io/spec/core/text/types.html#function-types
         * @see https://github.com/xtuc/js-webassembly-interpreter/issues/6
         */
        if (id === undefined) {
          while (token.type === tokens.valtype) {
            valtype = token.value;
            eatToken();

            params.push({
              id: undefined,
              valtype
            });
          }
        }
      } else {
        throw new Error("Function param has no valtype");
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

      if (isKeyword(token, keywords.memory)) {
        eatToken();
        const node = parseMemory();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.data)) {
        eatToken();
        const node = parseData();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.table)) {
        eatToken();
        const node = parseTable();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      if (isKeyword(token, keywords.global)) {
        eatToken();
        const node = parseGlobal();
        eatTokenOfType(tokens.closeParen);

        return node;
      }

      const instruction = parseFuncInstr();

      if (typeof instruction === "object") {
        eatTokenOfType(tokens.closeParen);

        return instruction;
      }
    }

    if (token.type === tokens.comment) {
      const builder =
        token.opts.type === "leading" ? t.leadingComment : t.blockComment;

      const node = builder(token.value);

      eatToken();

      return node;
    }

    showCodeFrame(source, token.loc);
    throw new TypeError("Unknown token: " + token.type);
  }

  const body = [];

  while (current < tokensList.length) {
    body.push(walk());
  }

  return t.program(body);
}
