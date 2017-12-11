// @flow

const readline = require('readline');

const {stdin, stdout} = process;

const {evaluateAst} = require('./interpreter');
const {parseSource} = require('./compiler/parsing/watf');
const {initializeMemory} = require('./interpreter/kernel/memory');

function wrapper(input: string): string {
  return `(module
    ${input}
  )`;
}

/**
 * Initialize the memory chunk used for allocation
 *
 * Do this globally and non-configurable for now.
 */
initializeMemory(1024);

if (!stdin.isTTY) {
  throw new Error('Cannot get input');
}

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

let openParenInc = 0;
let buffer = '';

rl.on('line', (input) => {
  if (input === '') {
    return;
  }

  buffer += input + '\n';

  if (input.indexOf('(') !== -1) {
    openParenInc++;
  }

  if (input.indexOf(')') !== -1) {
    openParenInc--;
  }

  if (openParenInc !== 0) {
    return;
  }

  console.log('>', buffer);

  const ast = parseSource(wrapper(buffer));
  const res = evaluateAst(ast);

  console.log(JSON.stringify(res));

  buffer = '';
});

rl.on('SIGINT', () => {
  console.log('Exit');

  process.exit(0);
});
