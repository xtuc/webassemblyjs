// @flow

const label = require('../../runtime/values/label');
const {RuntimeError} = require('../../../errors');

/**
 * Handle control instructions
 *
 * https://webassembly.github.io/spec/exec/instructions.html#control-instructions
 */

export function handleControlInstructions(
  instruction: Object,
  frame: StackFrame,
  frameutils: Object,
): any {

  switch (instruction.id) {

  case 'nop': {
    // Do nothing
    // https://webassembly.github.io/spec/exec/instructions.html#exec-nop
    break;
  }

  case 'loop': {
    // https://webassembly.github.io/spec/exec/instructions.html#exec-loop
    const loop = instruction;

    frameutils.assert(typeof loop.instr === 'object' && typeof loop.instr.length !== 'undefined');

    if (loop.instr.length > 0) {
      const childStackFrame = frameutils.createChildStackFrame(frame, loop.instr);
      childStackFrame.trace = frame.trace;

      const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

      if (frameutils.isTrapped(res)) {
        return res;
      }
    }

    break;
  }

  case 'drop': {
    // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

    frameutils.assertNItemsOnStack(frame.values, 1);

    frameutils.pop1();

    break;
  }

  case 'call': {
    // According to the spec call doesn't support an Identifier as argument
    // but the Script syntax supports it.
    // https://webassembly.github.io/spec/exec/instructions.html#exec-call

    const call = instruction;

    // WAST
    if (call.index.type === 'Identifier') {

      const element = frame.labels[call.index.name];

      if (typeof element === 'undefined') {
        throw new RuntimeError('Cannot call ' + call.index.name + ': label not found on the call stack');
      }

      if (element.type === 'Func') {

        const childStackFrame = frameutils.createChildStackFrame(frame, element.body);

        const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

        if (frameutils.isTrapped(res)) {
          return res;
        }

        if (typeof res !== 'undefined') {
          frameutils.pushResult(res);
        }
      }
    }

    // WASM
    if (call.index.type === 'NumberLiteral') {

      const index = call.index.value;

      frameutils.assert(typeof frame.originatingModule !== 'undefined');

      // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
      const funcaddr = frame.originatingModule.funcaddrs[index];

      if (typeof funcaddr === 'undefined') {

        throw new RuntimeError(
          `No function were found in module at address ${index}`
        );
      }

      // 3. Let a be the function address F.module.funcaddrs[x]

      const subroutine = frame.allocator.get(funcaddr);

      if (typeof subroutine !== 'object') {

        throw new RuntimeError(
          `Cannot call function at address ${funcaddr.index}: not a function`
        );
      }

      // 4. Invoke the function instance at address a

      // FIXME(sven): assert that res has type of resultType
      const [argTypes, resultType] = subroutine.type;

      const args = frameutils.popArrayOfValTypes(argTypes);

      if (subroutine.isExternal === false) {

        const childStackFrame = frameutils.createChildStackFrame(frame, subroutine.code);
        childStackFrame.values = args.map((arg) => arg.value);

        const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

        if (frameutils.isTrapped(res)) {
          return res;
        }

        if (typeof res !== 'undefined') {
          frameutils.pushResult(res);
        }

      } else {
        const res = subroutine.code(args.map((arg) => arg.value));

        frameutils.pushResult(
          frameutils.castIntoStackLocalOfType(resultType, res)
        );
      }

    }

    break;
  }

  case 'block': {
    const block = instruction;

    /**
       * Used to keep track of the number of values added on top of the stack
       * because we need to remove the label after the execution of this block.
       */
    let numberOfValuesAddedOnTopOfTheStack = 0;

    /**
       * When entering block push the label onto the stack
       */
    if (typeof block.label === 'string') {

      frameutils.pushResult(
        label.createValue(block.label)
      );
    }

    frameutils.assert(typeof block.instr === 'object' && typeof block.instr.length !== 'undefined');

    if (block.instr.length > 0) {
      const childStackFrame = frameutils.createChildStackFrame(frame, block.instr);
      childStackFrame.trace = frame.trace;

      const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

      if (frameutils.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        frameutils.pushResult(res);
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

    frameutils.pop1('label');

    frame.values = [...frame.values, ...topOfTheStack];

    break;
  }

  case 'if': {

    /**
       * Execute test
       */
    const childStackFrame = frameutils.createChildStackFrame(frame, instruction.test);
    childStackFrame.trace = frame.trace;

    const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

    if (frameutils.isTrapped(res)) {
      return res;
    }

    if (!frameutils.isZero(res)) {

      /**
         * Execute consequent
         */
      const childStackFrame = frameutils.createChildStackFrame(frame, instruction.consequent);
      childStackFrame.trace = frame.trace;

      const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

      if (frameutils.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        frameutils.pushResult(res);
      }

    } else if (typeof instruction.alternate !== 'undefined' && instruction.alternate.length > 0) {

      /**
         * Execute alternate
         */
      const childStackFrame = frameutils.createChildStackFrame(frame, instruction.alternate);
      childStackFrame.trace = frame.trace;

      const res = frameutils.executeStackFrame(childStackFrame, frameutils.depth + 1);

      if (frameutils.isTrapped(res)) {
        return res;
      }

      if (typeof res !== 'undefined') {
        frameutils.pushResult(res);
      }

    }

    break;
  }

  }
}
