// @flow

const label = require('../../runtime/values/label');
const {RuntimeError} = require('../../../errors');

/**
 * Handle control instructions
 *
 * https://webassembly.github.io/spec/exec/instructions.html#control-instructions
 */

export const controlInstructions = {

  nop() {
    // Do nothing
    // https://webassembly.github.io/spec/exec/instructions.html#exec-nop
  },

  loop(loop: LoopInstruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-loop

    this.assert(typeof loop.instr === 'object' && typeof loop.instr.length !== 'undefined');

    if (loop.instr.length > 0) {
      const res = this.createAndExecuteChildStackFrame(frame, loop.instr);

      if (this.isTrapped(res)) {
        return res;
      }
    }

  },

  drop(instruction: Instruction, frame: StackFrame) {
    // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

    this.assertNItemsOnStack(frame.values, 1);

    this.pop1();

  },

  call(call: CallInstruction, frame: StackFrame) {
    // According to the spec call doesn't support an Identifier as argument
    // but the Script syntax supports it.
    // https://webassembly.github.io/spec/exec/instructions.html#exec-call

    // WAST
    if (call.index.type === 'Identifier') {

      const element = frame.labels[call.index.name];

      if (typeof element === 'undefined') {
        throw new RuntimeError('Cannot call ' + call.index.name + ': label not found on the call stack');
      }

      if (element.type === 'Func') {
        const res = this.createAndExecuteChildStackFrame(frame, element.body);

        if (this.isTrapped(res)) {
          return res;
        }

        if (typeof res !== 'undefined') {
          this.pushResult(res);
        }
      }
    }

    // WASM
    if (call.index.type === 'NumberLiteral') {

      const index = call.index.value;

      this.assert(typeof frame.originatingModule !== 'undefined');

      // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
      const funcaddr = frame.originatingModule.funcaddrs[index];

      if (typeof funcaddr === 'undefined') {
        this.throwInvalidPointer('function', index);
      }

      // 3. Let a be the function address F.module.funcaddrs[x]

      const subroutine = frame.allocator.get(funcaddr);

      if (typeof subroutine !== 'object') {
        this.throwUnexpectedDataOnPointer('function', funcaddr);
      }

      // 4. Invoke the function instance at address a

      // FIXME(sven): assert that res has type of resultType
      const [argTypes, resultType] = subroutine.type;

      const args = this.popArrayOfValTypes(argTypes);

      if (subroutine.isExternal === false) {
        const res = this.createAndExecuteChildStackFrame(frame, subroutine.code);

        if (this.isTrapped(res)) {
          return res;
        }

        if (typeof res !== 'undefined') {
          this.pushResult(res);
        }

      } else {
        const res = subroutine.code(args.map((arg) => arg.value));

        this.pushResult(
          this.castIntoStackLocalOfType(resultType, res)
        );
      }

    }

  },

  block(block: BlockInstruction, frame: StackFrame) {

    /**
     * Used to keep track of the number of values added on top of the stack
     * because we need to remove the label after the execution of this block.
     */
    let numberOfValuesAddedOnTopOfTheStack = 0;

    /**
     * When entering block push the label onto the stack
     */
    if (typeof block.label === 'string') {

      this.pushResult(
        label.createValue(block.label)
      );
    }

    this.assert(typeof block.instr === 'object' && typeof block.instr.length !== 'undefined');

    if (block.instr.length > 0) {
      const res = this.createAndExecuteChildStackFrame(frame, block.instr);

      if (this.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        this.pushResult(res);
        numberOfValuesAddedOnTopOfTheStack++;
      }
    }

    /**
     * Wen exiting the block
     *
     * > Let m be the number of values on the top of the stack
     *
     * The Stack (values) are seperated by StackFrames and we are running on
     * one single thread, there's no need to check if values were added.
     *
     * We tracked it in numberOfValuesAddedOnTopOfTheStack anyway.
     */
    const topOfTheStack = frame.values.slice(frame.values.length - numberOfValuesAddedOnTopOfTheStack);

    frame.values.splice(frame.values.length - numberOfValuesAddedOnTopOfTheStack);

    this.pop1('label');

    frame.values = [...frame.values, ...topOfTheStack];
  },

  if(instruction: IfInstruction, frame: StackFrame) {

    /**
     * Execute test
     */
    const res = this.createAndExecuteChildStackFrame(frame, instruction.test);

    if (this.isTrapped(res)) {
      return res;
    }

    if (!this.isZero(res)) {

      /**
       * Execute consequent
       */
      const res = this.createAndExecuteChildStackFrame(frame, instruction.consequent);

      if (this.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        this.pushResult(res);
      }

    } else if (typeof instruction.alternate !== 'undefined' && instruction.alternate.length > 0) {

      /**
       * Execute alternate
       */
      const res = this.createAndExecuteChildStackFrame(frame, instruction.alternate);

      if (this.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        this.pushResult(res);
      }

    }
  }

};
