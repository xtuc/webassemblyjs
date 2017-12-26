// @flow

const {RuntimeError} = require('../../../errors');

/**
 * Memory Instructions
 *
 * https://webassembly.github.io/spec/exec/instructions.html#memory-instructions
 */

export const memoryInstructions = {

  get_local(instruction: Instruction) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-get-local
    const index = instruction.args[0];

    if (typeof index === 'undefined') {
      throw new RuntimeError('get_local requires one argument, none given.');
    }

    if (index.type === 'NumberLiteral') {
      this.getLocalByIndex(index.value);
    } else {
      throw new RuntimeError('get_local: unsupported index of type: ' + index.type);
    }

  },

  set_local(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-set-local
    const index = instruction.args[0];
    const init = instruction.args[1];

    if (typeof init !== 'undefined' && init.type === 'Instr') {
      // WAST

      const res = this.createAndExecuteChildStackFrame(frame, [init]);

      if (this.isTrapped(res)) {
        return res;
      }

      this.setLocalByIndex(index.value, res);
    } else if (index.type === 'NumberLiteral') {
      // WASM

      // 4. Pop the value val from the stack
      const val = this.pop1();

      // 5. Replace F.locals[x] with the value val
      this.setLocalByIndex(index.value, val);
    } else {
      throw new RuntimeError('set_local: unsupported index of type: ' + index.type);
    }
  },

  tee_local(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-tee-local
    const index = instruction.args[0];
    const init = instruction.args[1];

    if (typeof init !== 'undefined' && init.type === 'Instr') {
      // WAST

      const res = this.createAndExecuteChildStackFrame(frame, [init]);

      if (this.isTrapped(res)) {
        return res;
      }

      this.setLocalByIndex(index.value, res);

      this.pushResult(
        res
      );
    } else if (index.type === 'NumberLiteral')  {
      // WASM

      // 1. Assert: due to validation, a value is on the top of the stack.
      // 2. Pop the value val from the stack.
      const val = this.pop1();

      // 3. Push the value valval to the stack.
      this.pushResult(val);

      // 4. Push the value valval to the stack.
      this.pushResult(val);

      // 5. Execute the instruction (set_local x).
      // 5. 4. Pop the value val from the stack
      const val2 = this.pop1();

      // 5. 5. Replace F.locals[x] with the value val
      this.setLocalByIndex(index.value, val2);
    } else {
      throw new RuntimeError('tee_local: unsupported index of type: ' + index.type);
    }
  },

  set_global(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-set-global
    const index = instruction.args[0];

    // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
    const globaladdr = frame.originatingModule.globaladdrs[index];

    if (typeof globaladdr === 'undefined') {
      this.throwInvalidPointer('global', index);
    }

    // 4. Assert: due to validation, S.globals[a] exists.
    const globalinst = frame.allocator.get(globaladdr);

    if (typeof globalinst !== 'object') {
      this.throwUnexpectedDataOnPointer('global', globaladdr);
    }

    // 7. Pop the value val from the stack.
    const val = this.pop1();

    // 8. Replace glob.value with the value val.
    globalinst.value = val.value;

    frame.allocator.set(globaladdr, globalinst);
  },

  get_global(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-get-global
    const index = instruction.args[0];

    // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
    const globaladdr = frame.originatingModule.globaladdrs[index];

    if (typeof globaladdr === 'undefined') {
      this.throwInvalidPointer('global', index);
    }

    // 4. Assert: due to validation, S.globals[a] exists.
    const globalinst = frame.allocator.get(globaladdr);

    if (typeof globalinst !== 'object') {
      this.throwUnexpectedDataOnPointer('global', globaladdr);
    }

    // 7. Pop the value val from the stack.
    this.pushResult(globalinst);
  },

};
