// @flow

const {createTrap} = require('../signals');

/**
 * Administrative Instructions
 *
 * https://webassembly.github.io/spec/exec/runtime.html#administrative-instructions
 */

export const handleAdministrativeInstructions = {

  unreachable(instruction: Instruction, frame: StackFrame, frameutils: Object) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-unreachable

    return this.trap(instruction, frame, frameutils);
  },
    
  trap(instruction: Instruction, frame: StackFrame, frameutils: Object) {
    // signalling abrupt termination
    // https://webassembly.github.io/spec/exec/runtime.html#syntax-trap
    return createTrap();
  }

}
