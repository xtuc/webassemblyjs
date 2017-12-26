// @flow

const {createTrap} = require('../signals');

/**
 * Administrative Instructions
 *
 * https://webassembly.github.io/spec/exec/runtime.html#administrative-instructions
 */

export const administrativeInstructions = {

  unreachable(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-unreachable

    return this.trap(instruction, frame, this);
  },

  trap(instruction: Instruction, frame: StackFrame) {
    // signalling abrupt termination
    // https://webassembly.github.io/spec/exec/runtime.html#syntax-trap
    return createTrap();
  }

}
