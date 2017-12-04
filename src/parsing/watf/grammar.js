// @flow

const {tokens, keywords} = require('./tokenizer');
const t = require('../AST');

const told = {
  identifier() {},
  callExpression() {},
  program() {},
  expressionStatement() {},
};

function parse(tokensList: Array<Object>): Program {

  // Again we keep a `current` variable that we will use as a cursor.
  let current = 0;

  // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.
  function walk() {

    // Inside the walk function we start by grabbing the `current` token.
    let token = tokensList[current];

    // We're going to split each type of token off into a different code path,
    // starting off with `number` tokens.
    //
    // We test to see if we have a `number` token.
    if (token.type === tokens.number) {

      // If we have one, we'll increment `current`.
      current++;

      return told.numericLiteral(token.value);
    }

    // If we have a string we will do the same as number and create a
    // `StringLiteral` node.
    if (token.type === tokens.string) {
      current++;

      return told.stringLiteral(token.value);
    }

    // Next we're going to look for CallExpressions. We start this off when we
    // encounter an open parenthesis.
    if (token.type === tokens.openParen) {

      // We'll increment `current` to skip the parenthesis since we don't care
      // about it in our AST.
      token = tokensList[++current];

      if (token.type === keywords.module) {
        const name = null;
        const moduleFields = [];

        while (
          (token.type !== tokens.closeParen)
        ) {
          // we'll call the `walk` function which will return a `node` and we'll
          // push it into our `node.params`.
          moduleFields.push(walk());
          token = tokensList[current];
        }

        return t.module(name, moduleFields);
      }

      let params = [];
      const fnName = token.value;

      // We create a base node with the type `CallExpression`, and we're going
      // to set the name as the current token's value since the next token after
      // the open parenthesis is the name of the function.
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // We increment `current` *again* to skip the name token.
      token = tokensList[++current];

      // And now we want to loop through each token that will be the `params` of
      // our `CallExpression` until we encounter a closing parenthesis.
      //
      // Now this is where recursion comes in. Instead of trying to parse a
      // potentially infinitely nested set of nodes we're going to rely on
      // recursion to resolve things.
      //
      // To explain this, let's take our Lisp code. You can see that the
      // parameters of the `add` are a number and a nested `CallExpression` that
      // includes its own numbers.
      //
      //   (add 2 (subtract 4 2))
      //
      // You'll also notice that in our tokens array we have multiple closing
      // parenthesis.
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //   ]
      //
      // We're going to rely on the nested `walk` function to increment our
      // `current` variable past any nested `CallExpression`.

      // So we create a `while` loop that will continue until it encounters a
      // token with a `type` of `'paren'` and a `value` of a closing
      // parenthesis.
      while (
        (token.type !== tokens.closeParen)
      ) {
        // we'll call the `walk` function which will return a `node` and we'll
        // push it into our `node.params`.
        params.push(walk());
        token = tokensList[current];
      }

      // Finally we will increment `current` one last time to skip the closing
      // parenthesis.
      current++;

      // And return the node.
      return told.callExpression(
        told.identifier(fnName),
        params
      );
    }

    // Again, if we haven't recognized the token type by now we're going to
    // throw an error.
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
