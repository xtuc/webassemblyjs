// @flow

type AssertArgs = {|
  MSG?: string,
  COND: boolean
|};
declare function assert(AssertArgs): void;

type AssertNItemsOnStackArgs = {|
  N: number
|};
declare function assertNItemsOnStack(AssertNItemsOnStackArgs): void;

import { Memory } from "../runtime/values/memory";
import { RuntimeError } from "../../errors";
const t = require("@webassemblyjs/ast");

MACRO(
  assert,
  `if (!COND) {
    throw new RuntimeError("Assertion error: " + (MSG || "unknown"));
  }`
);

MACRO(
  assertNItemsOnStack,
  `if (frame.values.length < N) {
    throw new RuntimeError("Assertion error: expected " + N + " on the stack, found " + frame.values.length);
  }`
);

const {
  binopi32,
  binopi64,
  binopf32,
  binopf64
} = require("./instruction/binop");
const { unopi32, unopi64, unopf32, unopf64 } = require("./instruction/unop");
const {
  castIntoStackLocalOfType
} = require("../runtime/castIntoStackLocalOfType");
const i32 = require("../runtime/values/i32");
const i64 = require("../runtime/values/i64");
const f32 = require("../runtime/values/f32");
const f64 = require("../runtime/values/f64");
const label = require("../runtime/values/label");
const stackframe = require("./stackframe");
const { createTrap } = require("./signals");

// Syntactic sugar for the Syntactic sugar
// TODO(sven): do it AOT?
function addEndInstruction(body) {
  body.push(t.instruction("end"));
}

function assertStackDepth(depth: number) {
  if (depth >= 300) {
    throw new RuntimeError("Maximum call stack depth reached");
  }
}

type createChildStackFrameOptions = {
  // Pass the current stack to the child frame
  passCurrentContext?: boolean
};

export function executeStackFrame(
  firstFrame: StackFrame,
  depth: number = 0
): ?StackLocal {
  let stack: Array<StackFrame> = [firstFrame];
  let framepointer = 0;

  // eax
  let returnRegister = null;

  function run() {
    assertStackDepth(framepointer);

    const frame = stack[framepointer];

    assert({
      COND: frame !== undefined,
      MSG: "no frame at " + framepointer
    });

    framepointer++;

    function getLocalByIndex(index: number) {
      const local = frame.locals[index];

      if (typeof local === "undefined") {
        throw newRuntimeError(
          "Assertion error: no local value at index " + index
        );
      }

      frame.values.push(local);
    }

    function setLocalByIndex(index: number, value: StackLocal) {
      assert({ COND: typeof index === "number" });

      frame.locals[index] = value;
    }

    function pushResult(res: ?StackLocal) {
      if (typeof res === "undefined") {
        return;
      }

      frame.values.push(res);
    }

    function popArrayOfValTypes(types: Array<Valtype>): any {
      assertNItemsOnStack({ N: types.length });

      return types.map(type => {
        return pop1OfType(type);
      });
    }

    function pop1OfType(type: Valtype): any {
      assertNItemsOnStack({ N: 1 });

      const v = frame.values.pop();

      if (typeof type === "string" && v.type !== type) {
        throw newRuntimeError(
          "Internal failure: expected value of type " +
            type +
            " on top of the stack, type given: " +
            v.type
        );
      }

      return v;
    }

    function pop1(): any {
      assertNItemsOnStack({ N: 1 });

      return frame.values.pop();
    }

    function pop2(type1: Valtype, type2: Valtype): [any, any] {
      assertNItemsOnStack({ N: 2 });

      const c2 = frame.values.pop();
      const c1 = frame.values.pop();

      if (c2.type !== type2) {
        throw newRuntimeError(
          "Internal failure: expected c2 value of type " +
            type2 +
            " on top of the stack, give type: " +
            c2.type
        );
      }

      if (c1.type !== type1) {
        throw newRuntimeError(
          "Internal failure: expected c1 value of type " +
            type1 +
            " on top of the stack, give type: " +
            c1.type
        );
      }

      return [c1, c2];
    }

    function getLabel(index: Index): any {
      let code;

      if (index.type === "NumberLiteral") {
        const label: NumberLiteral = index;

        // WASM
        code = frame.labels.find(l => l.value.value === label.value);
      } else if (index.type === "Identifier") {
        const label: Identifier = index;

        // WAST
        code = frame.labels.find(l => {
          if (l.id == null) {
            return false;
          }

          return l.id.value === label.value;
        });
      }

      if (typeof code !== "undefined") {
        return code.value;
      }
    }

    function br(label: Index) {
      const code = getLabel(label);

      if (typeof code === "undefined") {
        throw newRuntimeError(`Label ${label.value} doesn't exist`);
      }

      // FIXME(sven): find a more generic way to handle label and its code
      // Currently func body and block instr*.
      const childStackFrame = stackframe.createChildStackFrame(
        frame,
        code.body || code.instr
      );

      return executeStackFrame(childStackFrame, depth + 1);
    }

    function getMemoryOffset(instruction) {
      if (instruction.namedArgs && instruction.namedArgs.offset) {
        const offset = instruction.namedArgs.offset.value;
        if (offset < 0) {
          throw newRuntimeError("offset must be positive");
        }
        if (offset > 0xffffffff) {
          throw newRuntimeError(
            "offset must be less than or equal to 0xffffffff"
          );
        }
        return offset;
      } else {
        return 0;
      }
    }

    function getMemory(): Memory {
      if (frame.originatingModule.memaddrs.length !== 1) {
        throw newRuntimeError("unknown memory");
      }

      const memAddr = frame.originatingModule.memaddrs[0];
      return frame.allocator.get(memAddr);
    }

    function newRuntimeError(msg) {
      return new RuntimeError(msg);
    }

    function createAndExecuteChildStackFrame(
      instrs: Array<Instruction>,
      { passCurrentContext }: createChildStackFrameOptions = {}
    ): ?StackLocal {
      // FIXME(sven): that's wrong
      const frame = stack[framepointer - 1];

      assert({
        COND: frame !== undefined,
        MSG: "no active frame"
      });

      const nextStackFrame = stackframe.createChildStackFrame(frame, instrs);

      if (passCurrentContext === true) {
        nextStackFrame.values = frame.values;
        nextStackFrame.labels = frame.labels;
      }

      // Push the frame on top of the stack
      stack[framepointer] = nextStackFrame;

      // Jump and execute the next frame
      run();

      if (returnRegister !== null) {
        frame.values.push(...returnRegister);
        returnRegister = null;
      }
    }

    while (true) {
      const instruction = frame.code[frame._pc];

      assert({
        COND: instruction !== undefined,
        MSG: `no instruction at pc ${frame._pc} in frame ${framepointer}`
      });

      if (typeof frame.trace === "function") {
        frame.trace(framepointer, frame._pc, instruction, frame);
      }

      frame._pc++;

      switch (instruction.type) {
        /**
         * Function declaration
         *
         * FIXME(sven): seems unspecified in the spec but it's required for the `call`
         * instruction.
         */
        case "Func": {
          const func = instruction;

          /**
           * Register the function into the stack frame labels
           */
          if (typeof func.name === "object") {
            if (func.name.type === "Identifier") {
              if (func.signature.type !== "Signature") {
                throw newRuntimeError(
                  "Function signatures must be denormalised before execution"
                );
              }
              frame.labels.push({
                value: func,
                arity: func.signature.params.length,
                id: func.name
              });
            }
          }

          break;
        }
      }

      switch (instruction.id) {
        case "const": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-const

          const n = instruction.args[0];

          if (typeof n === "undefined") {
            throw newRuntimeError("const requires one argument, none given.");
          }

          if (
            n.type !== "NumberLiteral" &&
            n.type !== "LongNumberLiteral" &&
            n.type !== "FloatLiteral"
          ) {
            throw newRuntimeError(
              "const: unsupported value of type: " + n.type
            );
          }

          pushResult(castIntoStackLocalOfType(instruction.object, n.value));

          break;
        }

        /**
         * Control Instructions
         *
         * https://webassembly.github.io/spec/core/exec/instructions.html#control-instructions
         */
        case "nop": {
          // Do nothing
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-nop
          break;
        }

        case "loop": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-loop
          const loop = instruction;

          assert({
            COND:
              typeof loop.instr === "object" &&
              typeof loop.instr.length !== "undefined"
          });

          // 2. Enter the block instr∗ with label
          frame.labels.push({
            value: loop,
            arity: 0,
            id: loop.label
          });

          pushResult(label.createValue(loop.label.value));

          if (loop.instr.length > 0) {
            createAndExecuteChildStackFrame(loop.instr, {
              passCurrentContext: true
            });
          }

          break;
        }

        case "drop": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

          // 1. Assert: due to validation, a value is on the top of the stack.
          assertNItemsOnStack({ N: 1 });

          // 2. Pop the value valval from the stack.
          pop1();

          break;
        }

        case "call": {
          // According to the spec call doesn't support an Identifier as argument
          // but the Script syntax supports it.
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-call

          const call = instruction;

          if (call.index.type === "Identifier") {
            throw newRuntimeError(
              "Internal compiler error: Identifier argument in call must be " +
                "transformed to a NumberLiteral node"
            );
          }

          // WASM
          if (call.index.type === "NumberLiteral") {
            const index = call.index.value;

            assert({
              COND: typeof frame.originatingModule !== "undefined"
            });

            // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
            const funcaddr = frame.originatingModule.funcaddrs[index];

            if (typeof funcaddr === "undefined") {
              throw newRuntimeError(
                `No function were found in module at address ${index}`
              );
            }

            // 3. Let a be the function address F.module.funcaddrs[x]

            const subroutine = frame.allocator.get(funcaddr);

            if (typeof subroutine !== "object") {
              throw newRuntimeError(
                `Cannot call function at address ${funcaddr}: not a function`
              );
            }

            // 4. Invoke the function instance at address a

            // FIXME(sven): assert that res has type of resultType
            const [argTypes, resultType] = subroutine.type;

            const args = popArrayOfValTypes(argTypes);

            if (subroutine.isExternal === false) {
              createAndExecuteChildStackFrame(subroutine.code);
            } else {
              const res = subroutine.code(args.map(arg => arg.value));

              if (typeof res !== "undefined") {
                pushResult(castIntoStackLocalOfType(resultType, res));
              }
            }
          }

          break;
        }

        case "block": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#blocks

          const block = instruction;

          /**
           * Used to keep track of the number of values added on top of the stack
           * because we need to remove the label after the execution of this block.
           */
          let numberOfValuesAddedOnTopOfTheStack = 0;

          // 2. Enter the block instr∗ with label
          frame.labels.push({
            value: block,
            arity: 0,
            id: block.label
          });

          if (block.label.type === "Identifier") {
            pushResult(label.createValue(block.label.value));
          } else {
            throw newRuntimeError("Block has no id");
          }

          assert({
            COND:
              typeof block.instr === "object" &&
              typeof block.instr.length !== "undefined"
          });

          if (block.instr.length > 0) {
            const oldStackSize = frame.values.length;

            createAndExecuteChildStackFrame(block.instr, {
              passCurrentContext: true
            });

            numberOfValuesAddedOnTopOfTheStack =
              frame.values.length - oldStackSize;
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
          const topOfTheStack = frame.values.slice(
            frame.values.length - numberOfValuesAddedOnTopOfTheStack
          );

          frame.values.splice(
            frame.values.length - numberOfValuesAddedOnTopOfTheStack
          );

          // 3. Assert: due to validation, the label LL is now on the top of the stack.
          // 4. Pop the label from the stack.
          pop1OfType("label");

          frame.values = [...frame.values, ...topOfTheStack];

          // Remove label
          frame.labels = frame.labels.filter(x => {
            if (x.id == null) {
              return true;
            }

            return x.id.value !== block.label.value;
          });

          break;
        }

        case "br": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-br

          const [label, ...children] = instruction.args;

          if (label.type === "Identifier") {
            throw newRuntimeError(
              "Internal compiler error: Identifier argument in br must be " +
                "transformed to a NumberLiteral node"
            );
          }

          const l = label.value;

          // 1. Assert: due to validation, the stack contains at least l+1 labels.
          assertNItemsOnStack({ N: l + 1 });

          // 2. Let L be the l-th label appearing on the stack, starting from the top and counting from zero.
          let seenLabels = 0;
          let labelidx = { value: "unknown" };
          // for (var i = 0, len = frame.values.length; i < len; i++) {
          for (let i = frame.values.length; i--; ) {
            if (frame.values[i].type === "label") {
              if (seenLabels === l) {
                labelidx = frame.values[i];
                break;
              }

              seenLabels++;
            }
          }

          // $FlowIgnore
          const L = frame.labels.find(x => x.id.value === labelidx.value);

          if (typeof L === "undefined") {
            throw newRuntimeError(`br: unknown label ${labelidx.value}`);
          }

          // 3. Let n be the arity of L.
          const n = L.arity;

          // 4. Assert: due to validation, there are at least nn values on the top of the stack.
          assertNItemsOnStack({ N: n });

          // 5. Pop the values valn from the stack
          const val = frame.values[n];

          const bottomOfTheStack = frame.values.slice(0, n);
          const topOfTheStack = frame.values.slice(n + 1);

          frame.values = [...bottomOfTheStack, ...topOfTheStack];

          // 6. Repeat l+1 times:
          for (let i = 0; i < l + 1; i++) {
            // a. While the top of the stack is a value, do:
            // i. Pop the value from the stack
            const value = frame.values[frame.values.length - 1];

            if (typeof value === "undefined") {
              break;
            }

            if (value.type !== "label") {
              pop1();
            }
          }

          // b. Assert: due to validation, the top of the stack now is a label.
          // c. Pop the label from the stack.
          pop1OfType("label");

          // 7. Push the values valn to the stack.
          pushResult(val);

          // 0 is the current frame, 1 is it's parent.
          stack = stack.slice(0, -(l + 1));
          framepointer -= l + 1;

          // execute childrens
          addEndInstruction(children);
          createAndExecuteChildStackFrame(children, {
            passCurrentContext: true
          });

          return;
        }

        case "br_if": {
          const [label, ...children] = instruction.args;

          // execute childrens
          addEndInstruction(children);

          createAndExecuteChildStackFrame(children, {
            passCurrentContext: true
          });

          // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
          // 2. Pop the value ci32.const c from the stack.
          const c = pop1OfType("i32");

          if (!c.value.eqz().isTrue()) {
            // 3. If c is non-zero, then
            // 3. a. Execute the instruction (br l).
            const res = br(label);

            pushResult(res);
          } else {
            // 4. Else:
            // 4. a. Do nothing.
          }

          break;
        }

        case "if": {
          if (instruction.test.length > 0) {
            createAndExecuteChildStackFrame(instruction.test);
          }

          // 1. Assert: due to validation, a value of value type i32 is on the top of the stack.
          // 2. Pop the value i32.const from the stack.
          const c = pop1OfType("i32");

          if (c.value.eqz().isTrue() === false) {
            /**
             * Execute consequent
             */
            createAndExecuteChildStackFrame(instruction.consequent);
          } else if (
            typeof instruction.alternate !== "undefined" &&
            instruction.alternate.length > 0
          ) {
            /**
             * Execute alternate
             */
            createAndExecuteChildStackFrame(instruction.alternate);
          }

          break;
        }

        /**
         * Administrative Instructions
         *
         * https://webassembly.github.io/spec/core/exec/runtime.html#administrative-instructions
         */
        case "unreachable":
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-unreachable
        case "trap": {
          // signalling abrupt termination
          // https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
          throw createTrap();
        }

        case "local": {
          const [valtype] = instruction.args;

          const init = castIntoStackLocalOfType(valtype.name, 0);
          frame.locals.push(init);

          break;
        }

        /**
         * Memory Instructions
         *
         * https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions
         */
        case "get_local": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-local
          const index = instruction.args[0];

          if (typeof index === "undefined") {
            throw newRuntimeError(
              "get_local requires one argument, none given."
            );
          }

          if (index.type === "NumberLiteral" || index.type === "FloatLiteral") {
            getLocalByIndex(index.value);
          } else {
            throw newRuntimeError(
              "get_local: unsupported index of type: " + index.type
            );
          }

          break;
        }

        case "set_local": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-local
          const index = instruction.args[0];
          const init = instruction.args[1];

          if (typeof init !== "undefined" && init.type === "Instr") {
            // WAST

            const code = [init];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });

            const res = pop1();
            setLocalByIndex(index.value, res);
          } else if (index.type === "NumberLiteral") {
            // WASM

            // 4. Pop the value val from the stack
            const val = pop1();

            // 5. Replace F.locals[x] with the value val
            setLocalByIndex(index.value, val);
          } else {
            throw newRuntimeError(
              "set_local: unsupported index of type: " + index.type
            );
          }

          break;
        }

        case "tee_local": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-tee-local
          const index = instruction.args[0];
          const init = instruction.args[1];

          if (typeof init !== "undefined" && init.type === "Instr") {
            // WAST

            const code = [init];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });

            const res = pop1();
            setLocalByIndex(index.value, res);

            pushResult(res);
          } else if (index.type === "NumberLiteral") {
            // WASM

            // 1. Assert: due to validation, a value is on the top of the stack.
            // 2. Pop the value val from the stack.
            const val = pop1();

            // 3. Push the value valval to the stack.
            pushResult(val);

            // 4. Push the value valval to the stack.
            pushResult(val);

            // 5. Execute the instruction (set_local x).
            // 5. 4. Pop the value val from the stack
            const val2 = pop1();

            // 5. 5. Replace F.locals[x] with the value val
            setLocalByIndex(index.value, val2);
          } else {
            throw newRuntimeError(
              "tee_local: unsupported index of type: " + index.type
            );
          }

          break;
        }

        case "set_global": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-global
          const [index, right] = instruction.args;

          // Interpret right branch first if it's a child instruction
          if (typeof right !== "undefined") {
            const code = [right];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });
          }

          // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
          const globaladdr = frame.originatingModule.globaladdrs[index.value];

          if (typeof globaladdr === "undefined") {
            throw newRuntimeError(`Global address ${index.value} not found`);
          }

          // 4. Assert: due to validation, S.globals[a] exists.
          const globalinst = frame.allocator.get(globaladdr);

          if (typeof globalinst !== "object") {
            throw newRuntimeError(
              `Unexpected data for global at ${globaladdr}`
            );
          }

          // 7. Pop the value val from the stack.
          const val = pop1();

          // 8. Replace glob.value with the value val.
          globalinst.value = val.value;

          frame.allocator.set(globaladdr, globalinst);

          break;
        }

        case "get_global": {
          // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-global
          const index = instruction.args[0];

          // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
          const globaladdr = frame.originatingModule.globaladdrs[index.value];

          if (typeof globaladdr === "undefined") {
            throw newRuntimeError(`Unknown global at index: ${index.value}`);
          }

          // 4. Assert: due to validation, S.globals[a] exists.
          const globalinst = frame.allocator.get(globaladdr);

          if (typeof globalinst !== "object") {
            throw newRuntimeError(
              `Unexpected data for global at ${globaladdr}`
            );
          }

          // 7. Pop the value val from the stack.
          pushResult(globalinst);

          break;
        }

        case "return": {
          const { args } = instruction;

          if (args.length > 0) {
            addEndInstruction(args);
            createAndExecuteChildStackFrame(args, { passCurrentContext: true });
          }

          // Abort execution and return the first item on the stack
          returnRegister = [pop1()];
          return;
        }

        /**
         * Memory operations
         */

        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-storen
        case "store":
        case "store8":
        case "store16":
        case "store32": {
          const { id, object, args } = instruction;

          // Interpret children first
          // only WAST
          if (typeof args !== "undefined" && args.length > 0) {
            addEndInstruction(args);
            createAndExecuteChildStackFrame(args, { passCurrentContext: true });
          }

          const memory = getMemory();

          const [c1, c2] = pop2("i32", object);
          const ptr = c1.value.toNumber() + getMemoryOffset(instruction);
          let valueBuffer = c2.value.toByteArray();

          switch (id) {
            case "store8":
              valueBuffer = valueBuffer.slice(0, 1);
              break;
            case "store16":
              valueBuffer = valueBuffer.slice(0, 2);
              break;
            case "store32":
              valueBuffer = valueBuffer.slice(0, 4);
              break;
          }

          if (ptr + valueBuffer.length > memory.buffer.byteLength) {
            throw newRuntimeError("memory access out of bounds");
          }

          const memoryBuffer = new Uint8Array(memory.buffer);

          // load / store use little-endian order
          for (let ptrOffset = 0; ptrOffset < valueBuffer.length; ptrOffset++) {
            memoryBuffer[ptr + ptrOffset] = valueBuffer[ptrOffset];
          }
          break;
        }

        // https://webassembly.github.io/spec/core/exec/instructions.html#and
        case "load":
        case "load16_s":
        case "load16_u":
        case "load8_s":
        case "load8_u":
        case "load32_s":
        case "load32_u": {
          const { id, object, args } = instruction;

          // Interpret children first
          // only WAST
          if (typeof args !== "undefined" && args.length > 0) {
            addEndInstruction(args);
            createAndExecuteChildStackFrame(args, { passCurrentContext: true });
          }

          const memory = getMemory();

          const ptr =
            pop1OfType("i32").value.toNumber() + getMemoryOffset(instruction);

          // for i32 / i64 ops, handle extended load
          let extend = 0;
          // for i64 values, increase the bitshift by 4 bytes
          const extendOffset = object === "i32" ? 0 : 32;
          let signed = false;
          switch (id) {
            case "load16_s":
              extend = 16 + extendOffset;
              signed = true;
              break;
            case "load16_u":
              extend = 16 + extendOffset;
              signed = false;
              break;
            case "load8_s":
              extend = 24 + extendOffset;
              signed = true;
              break;
            case "load8_u":
              extend = 24 + extendOffset;
              signed = false;
              break;
            case "load32_u":
              extend = 0 + extendOffset;
              signed = false;
              break;
            case "load32_s":
              extend = 0 + extendOffset;
              signed = true;
              break;
          }

          // check for memory access out of bounds
          switch (object) {
            case "i32":
            case "f32":
              if (ptr + 4 > memory.buffer.byteLength) {
                throw newRuntimeError("memory access out of bounds");
              }
              break;
            case "i64":
            case "f64":
              if (ptr + 8 > memory.buffer.byteLength) {
                throw newRuntimeError("memory access out of bounds");
              }
              break;
          }

          switch (object) {
            case "i32":
            case "u32":
              pushResult(
                i32.createValueFromArrayBuffer(
                  memory.buffer,
                  ptr,
                  extend,
                  signed
                )
              );
              break;
            case "i64":
              pushResult(
                i64.createValueFromArrayBuffer(
                  memory.buffer,
                  ptr,
                  extend,
                  signed
                )
              );
              break;
            case "f32":
              pushResult(f32.createValueFromArrayBuffer(memory.buffer, ptr));
              break;
            case "f64":
              pushResult(f64.createValueFromArrayBuffer(memory.buffer, ptr));
              break;

            default:
              throw new RuntimeError("Unsupported " + object + " load");
          }

          break;
        }

        /**
         * Binary operations
         */
        case "add":
        case "mul":
        case "sub":
        /**
         * There are two seperated operation for both signed and unsigned integer,
         * but since the host environment will handle that, we don't have too :)
         */
        case "div_s":
        case "div_u":
        case "rem_s":
        case "rem_u":
        case "shl":
        case "shr_s":
        case "shr_u":
        case "rotl":
        case "rotr":
        case "div":
        case "min":
        case "max":
        case "copysign":
        case "or":
        case "xor":
        case "and":
        case "eq":
        case "ne":
        case "lt_s":
        case "lt_u":
        case "le_s":
        case "le_u":
        case "gt":
        case "gt_s":
        case "gt_u":
        case "ge_s":
        case "ge_u": {
          let binopFn;
          switch (instruction.object) {
            case "i32":
              binopFn = binopi32;
              break;
            case "i64":
              binopFn = binopi64;
              break;
            case "f32":
              binopFn = binopf32;
              break;
            case "f64":
              binopFn = binopf64;
              break;
            default:
              throw createTrap(
                "Unsupported operation " +
                  instruction.id +
                  " on " +
                  instruction.object
              );
          }

          const [left, right] = instruction.args;

          // Interpret left branch first if it's a child instruction
          if (typeof left !== "undefined") {
            const code = [left];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });
          }

          // Interpret right branch first if it's a child instruction
          if (typeof right !== "undefined") {
            const code = [right];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });
          }

          const [c1, c2] = pop2(instruction.object, instruction.object);
          pushResult(binopFn(c1, c2, instruction.id));

          break;
        }

        /**
         * Unary operations
         */
        case "abs":
        case "neg":
        case "clz":
        case "ctz":
        case "popcnt":
        case "eqz":
        case "reinterpret/f32":
        case "reinterpret/f64": {
          let unopFn;

          // for conversion operations, the operand type appears after the forward-slash
          // e.g. with i32.reinterpret/f32, the oprand is f32, and the resultant is i32
          const opType =
            instruction.id.indexOf("/") !== -1
              ? instruction.id.split("/")[1]
              : instruction.object;

          switch (opType) {
            case "i32":
              unopFn = unopi32;
              break;
            case "i64":
              unopFn = unopi64;
              break;
            case "f32":
              unopFn = unopf32;
              break;
            case "f64":
              unopFn = unopf64;
              break;
            default:
              throw createTrap(
                "Unsupported operation " + instruction.id + " on " + opType
              );
          }

          const [operand] = instruction.args;

          // Interpret argument first if it's a child instruction
          if (typeof operand !== "undefined") {
            const code = [operand];
            addEndInstruction(code);

            createAndExecuteChildStackFrame(code, {
              passCurrentContext: true
            });
          }

          const c = pop1OfType(opType);

          pushResult(unopFn(c, instruction.id));

          break;
        }

        case "end": {
          // Pop active frame from the stack
          stack.pop();
          framepointer--;

          // Return the item on top of the values/stack;
          if (frame.values.length > 0) {
            const res = pop1();

            if (res.type !== "label") {
              returnRegister = [res];
            } else {
              // Push label back
              pushResult(res);
            }
          }

          return;
        }
      }
    }
  }

  run();

  if (returnRegister !== null) {
    // FIXME(sven): handle multiple results in hostfunc
    return returnRegister[0];
  }
}
