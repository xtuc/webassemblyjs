// @flow

const {createTrap} = require('../signals');

/**
 * Administrative Instructions
 *
 * https://webassembly.github.io/spec/exec/runtime.html#administrative-instructions
 */

export function handleAdministrativeInstructions(
  instruction: Object,
  frame: StackFrame,
  frameutils: Object,
): any {

  switch (instruction.id) {

  case 'unreachable':
    // https://webassembly.github.io/spec/exec/instructions.html#exec-unreachable
  case 'trap': {
    // signalling abrupt termination
    // https://webassembly.github.io/spec/exec/runtime.html#syntax-trap
    return createTrap();
  }

  }

}
