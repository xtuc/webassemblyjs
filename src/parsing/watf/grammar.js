// @flow

const {tokens, keywords} = require('./tokenizer');
const t = require('../AST');

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

    function parseFunc() {
      eatToken();

      let fnName = null;
      let fnResult = null;

      const fnBody = [];
      const fnParams = [];

      if (token.type === tokens.identifier) {
        fnName = token.value;
        eatToken();
      }

      if (token.type === tokens.openParen) {
        eatToken();

        while (
          (token.type !== tokens.closeParen)
        ) {

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
          }

          /**
           * Function result
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

          eatToken();
        }
      }

      /**
       * Function body
       */
      while (
        (token.type !== tokens.closeParen)
      ) {

        if (token.type === tokens.name || token.type === tokens.valtype) {
          let name = token.value;
          const args = [];

          eatToken();

          if (token.type === tokens.dot) {
            eatToken();

            name += '.';

            if (token.type !== tokens.name) {
              throw new TypeError('Unknown token: ' + token.type + ', dot exepected');
            }

            name += token.value;

            eatToken();
          }

          /**
           * Handle arguments
           *
           * Currently only one argument is allowed
           */
          if (token.type === tokens.identifier || token.type === tokens.number) {
            args.push(token.value);
          }

          fnBody.push(t.instruction(name, args));
        } else {
          throw new Error('Unexpected token in function body: ' + token.type);
        }

        eatToken();
      }

      eatToken();

      return t.func(fnName, fnParams, fnResult, fnBody);
    }

    // Next we're going to look for CallExpressions. We start this off when we
    // encounter an open parenthesis.
    if (token.type === tokens.openParen) {

      // We'll increment `current` to skip the parenthesis since we don't care
      // about it in our AST.
      eatToken();

      if (isKeyword(token, keywords.export)) {
        eatToken();

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
              id = parseFunc().id;
            }

            eatToken();
          }
        }

        return t.moduleExport(name, type, id);
      }

      if (isKeyword(token, keywords.func)) {
        return parseFunc();
      }

      if (isKeyword(token, keywords.module)) {
        eatToken();

        let name = null;
        const moduleFields = [];

        if (token.type === tokens.identifier) {
          name = token.value;
          eatToken();
        }

        while (
          (token.type !== tokens.closeParen)
        ) {
          // we'll call the `walk` function which will return a `node` and we'll
          // push it into our `node.params`.
          moduleFields.push(walk());
          token = tokensList[current];
        }

        eatToken();

        return t.module(name, moduleFields);
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
