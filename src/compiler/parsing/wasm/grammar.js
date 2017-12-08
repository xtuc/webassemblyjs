// @flow

const t = require('../../AST');

export function parse(tokensList: Array<Object>): Node {
  let current = 0;

  function walk(): Node {
    let token = tokensList[current];

    function eatToken() {
      token = tokensList[++current];
    }

    console.log(token);

    const n = t.instruction(token.type, []);

    eatToken();

    return n;

    throw new Error('Expected token: ' + token.type);
  }

  const body = [];

  while (current < tokensList.length) {
    body.push(
      walk()
    );
  }

  return t.program(body);
}
