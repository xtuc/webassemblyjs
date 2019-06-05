// @flow

import { assertRuntimeError, define } from "mamacro";

import Long from "@xtuc/long";
import { Memory } from "../runtime/values/memory";
import { RuntimeError } from "../../errors";

declare function trace(msg?: string): void;
declare function GOTO(l: number): void;
declare function RETURN(): void;
declare function PUSH_NEW_STACK_FRAME(pc: number): void;
declare function POP_STACK_FRAME(): void;
declare function POP_LABEL(): void;
declare function assertNItemsOnStack(n: number): void;

define(assertNItemsOnStack, n => `
  if (frame.values.length < ${n}) {
    throw new RuntimeError(
      "Assertion error: expected " + JSON.stringify(${n})
        + " on the stack, found " + frame.values.length
    );
  }`);

define(trace, msg => `
    console.log("trace " + ${msg});
  `);

define(POP_LABEL, () => `
    // 3. Assert: due to validation, the label L is now on the top of the stack.
    // 4. Pop the label from the stack.
    let found = false;

    const index = frame.values.slice(0).reverse().findIndex(({type}) => type === "label");
    // some expression like inittializer don't have labels currently, so this is
    // guarantee to fail
    // assertRuntimeError(index !== -1, "POP_LABEL: label not found")

    if (index !== -1) {
      const initialOrderIndex = frame.values.length - 1 - index;

      trace("exiting block " + frame.values[initialOrderIndex].value);

      frame.values.splice(initialOrderIndex, 1);
    }
  `);

define(GOTO, labelOffset => `
    pc = offsets.indexOf(String(${labelOffset}));
  `);

define(RETURN, () => `
    const activeFrame = getActiveStackFrame();

    if (activeFrame.values.length > 0) {
      return pop1(activeFrame);
    } else {
      return;
    }
  `);

define(PUSH_NEW_STACK_FRAME, pc => `
    const stackframe = require("./stackframe");

    const activeFrame = getActiveStackFrame();
    const newStackFrame = stackframe.createChildStackFrame(activeFrame, ${pc});

    // move active frame
    framepointer++;

    if (framepointer >= 300) {
      throw new RuntimeError("Maximum call stack depth reached");
    }

    // Push the frame on top of the stack
    callStack[framepointer] = newStackFrame;
  `);

define(POP_STACK_FRAME, () => `
    const activeFrame = getActiveStackFrame();

    // pass the result of the previous call into the new active fame
    let res;

    if (activeFrame.values.length > 0) {
      res = pop1(activeFrame);
    }

    // Pop active frame from the stack
    callStack.pop();
    framepointer--;

    const newStackFrame = getActiveStackFrame();

    if (res !== undefined && newStackFrame !== undefined) {
      pushResult(newStackFrame, res);
    }
  `);

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
const { createTrap } = require("./signals");
const { compare } = require("./instruction/comparison");

export function executeStackFrame(
  { program }: IR,
  offset: number,
  firstFrame: StackFrame
): ?StackLocal {
  assertRuntimeError(typeof program === "object");

  const callStack: Array<StackFrame> = [firstFrame];

  // because it's used a macros
  // eslint-disable-next-line prefer-const
  let framepointer = 0;

  function getLocalByIndex(frame: StackFrame, index: number) {
    const local = frame.locals[index];

    if (typeof local === "undefined") {
      throw newRuntimeError(
        "Assertion error: no local value at index " + index
      );
    }

    frame.values.push(local);
  }

  function setLocalByIndex(
    frame: StackFrame,
    index: number,
    value: StackLocal
  ) {
    assertRuntimeError(typeof index === "number");

    frame.locals[index] = value;
  }

  function pushResult(frame: StackFrame, res: ?StackLocal) {
    if (typeof res === "undefined") {
      return;
    }

    frame.values.push(res);
  }

  function popArrayOfValTypes(frame: StackFrame, types: Array<Valtype>): any {
    assertNItemsOnStack(types.length);

    return types.map(type => {
      return pop1OfType(frame, type);
    });
  }

  function valueTypeEq(l: string, r: string): boolean {
    // compatibility with our parser
    if (l === "u32") {
      l = "i32";
    }
    if (l === "u64") {
      l = "i64";
    }

    if (r === "u32") {
      r = "i32";
    }
    if (r === "u64") {
      r = "i64";
    }

    return l === r;
  }

  function pop1OfType(frame: StackFrame, type: Valtype): any {
    assertNItemsOnStack(1);

    const v = frame.values.pop();

    if (typeof type === "string" && valueTypeEq(v.type, type) === false) {
      throw newRuntimeError(
        "Internal failure: expected value of type " +
          type +
          " on top of the stack, type given: " +
          v.type
      );
    }

    return v;
  }

  function pop1(frame: StackFrame): any {
    assertNItemsOnStack(1);

    return frame.values.pop();
  }

  function pop2(frame: StackFrame, type1: Valtype, type2: Valtype): [any, any] {
    assertNItemsOnStack(2);

    const c2 = frame.values.pop();
    const c1 = frame.values.pop();

    if (valueTypeEq(c2.type, type2) === false) {
      throw newRuntimeError(
        "Internal failure: expected c2 value of type " +
          type2 +
          " on top of the stack, given type: " +
          c2.type
      );
    }

    if (valueTypeEq(c1.type, type1) === false) {
      throw newRuntimeError(
        "Internal failure: expected c1 value of type " +
          type1 +
          " on top of the stack, given type: " +
          c1.type
      );
    }

    return [c1, c2];
  }

  function getMemoryOffset(frame: StackFrame, instruction) {
    if (instruction.namedArgs && instruction.namedArgs.offset) {
      // $FlowIgnore
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

  function getMemory(frame: StackFrame): Memory {
    if (frame.originatingModule.memaddrs.length !== 1) {
      throw newRuntimeError("unknown memory");
    }

    const memAddr = frame.originatingModule.memaddrs[0];
    return frame.allocator.get(memAddr);
  }

  function newRuntimeError(msg) {
    return new RuntimeError(msg);
  }

  function getActiveStackFrame(): StackFrame {
    assertRuntimeError(framepointer > -1, "call stack underflow");

    const frame = callStack[framepointer];
    assertRuntimeError(frame !== undefined, "no frame at " + framepointer);

    return frame;
  }

  const offsets = Object.keys(program);
  let pc = offsets.indexOf(String(offset));

  while (true) {
    const frame = getActiveStackFrame();
    const instruction = program[parseInt(offsets[pc])];

    assertRuntimeError(
      instruction !== undefined,
      `no instruction at pc ${pc} in frame ${framepointer}`
    );

    // $FlowIgnore
    trace(`exec ${instruction.type}(${instruction.id || ""})`);

    if (typeof frame.trace === "function") {
      frame.trace(framepointer, pc, instruction, frame);
    }

    pc++;

    switch (instruction.type) {
      case "InternalEndAndReturn": {
        if (frame.returnAddress !== -1) {
          pc = frame.returnAddress; // raw goto
          POP_STACK_FRAME();

          break;
        } else {
          RETURN();
        }
      }

      case "InternalGoto": {
        const { target } = instruction;

        GOTO(target);

        break;
      }

      case "InternalCallExtern": {
        const { target } = instruction;

        // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
        const funcaddr = frame.originatingModule.funcaddrs[target];

        if (typeof funcaddr === "undefined") {
          throw newRuntimeError(
            `No function was found in module at address ${target}`
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

        const args = popArrayOfValTypes(frame, argTypes);

        assertRuntimeError(subroutine.isExternal);

        const res = subroutine.code(args.map(arg => arg.value));

        if (typeof res !== "undefined") {
          pushResult(frame, castIntoStackLocalOfType(resultType, res));
        }

        break;
      }
    }

    switch (instruction.id) {
      case "const": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-const

        // $FlowIgnore
        const n = instruction.args[0];

        if (typeof n === "undefined") {
          throw newRuntimeError("const requires one argument, none given.");
        }

        if (
          n.type !== "NumberLiteral" &&
          n.type !== "LongNumberLiteral" &&
          n.type !== "FloatLiteral"
        ) {
          throw newRuntimeError("const: unsupported value of type: " + n.type);
        }

        pushResult(
          frame,
          // $FlowIgnore
          castIntoStackLocalOfType(instruction.object, n.value)
        );

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

      case "drop": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

        // 1. Assert: due to validation, a value is on the top of the stack.
        assertNItemsOnStack(1);

        // 2. Pop the value valval from the stack.
        pop1(frame);

        break;
      }

      case "call": {
        // FIXME(sven): check spec compliancy

        // $FlowIgnore
        const index = instruction.index.value;

        PUSH_NEW_STACK_FRAME(pc);
        // $FlowIgnore
        GOTO(index);

        break;
      }

      case "end": {
        POP_LABEL();

        break;
      }

      case "loop":
      case "block": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#blocks
        // FIXME(sven): check spec compliancy

        const block = instruction;

        // 2. Enter the block instr∗ with label
        frame.labels.push({
          value: block,
          arity: 0,
          // $FlowIgnore
          id: block.label
        });

        // $FlowIgnore
        pushResult(frame, label.createValue(block.label.value));

        // $FlowIgnore
        trace("entering block " + block.label.value);

        break;
      }

      case "br": {
        // FIXME(sven): check spec compliancy
        // $FlowIgnore
        const label = instruction.args[0];
        // $FlowIgnore
        GOTO(label.value);

        break;
      }

      case "br_if": {
        // $FlowIgnore
        const label = instruction.args[0];

        // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
        // 2. Pop the value ci32.const c from the stack.
        const c = pop1OfType(frame, "i32");

        if (c.value.eqz().isTrue() === false) {
          // 3. If c is non-zero, then
          // 3. a. Execute the instruction (br l).
          // $FlowIgnore
          GOTO(label.value);
        } else {
          // 4. Else:
          // 4. a. Do nothing.
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
        // $FlowIgnore
        const [valtype] = instruction.args;

        if (valtype.name === "i64") {
          const init = castIntoStackLocalOfType(valtype.name, new Long(0, 0));
          frame.locals.push(init);
        } else {
          // $FlowIgnore
          const init = castIntoStackLocalOfType(valtype.name, 0);
          frame.locals.push(init);
        }

        // $FlowIgnore
        trace("new local " + valtype.name);

        break;
      }

      /**
       * Memory Instructions
       *
       * https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions
       */
      case "get_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-local
        // $FlowIgnore
        const index = instruction.args[0];

        if (typeof index === "undefined") {
          throw newRuntimeError("get_local requires one argument, none given.");
        }

        if (index.type === "NumberLiteral" || index.type === "FloatLiteral") {
          getLocalByIndex(frame, index.value);
        } else {
          throw newRuntimeError(
            "get_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "set_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-local
        // $FlowIgnore
        const index = instruction.args[0];

        if (index.type === "NumberLiteral") {
          // WASM

          // 4. Pop the value val from the stack
          const val = pop1(frame);

          // 5. Replace F.locals[x] with the value val
          setLocalByIndex(frame, index.value, val);
        } else {
          throw newRuntimeError(
            "set_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "tee_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-tee-local
        // $FlowIgnore
        const index = instruction.args[0];

        if (index.type === "NumberLiteral") {
          // 1. Assert: due to validation, a value is on the top of the stack.
          // 2. Pop the value val from the stack.
          const val = pop1(frame);

          // 3. Push the value valval to the stack.
          pushResult(frame, val);

          // 4. Push the value valval to the stack.
          pushResult(frame, val);

          // 5. Execute the instruction (set_local x).
          // 5. 4. Pop the value val from the stack
          const val2 = pop1(frame);

          // 5. 5. Replace F.locals[x] with the value val
          setLocalByIndex(frame, index.value, val2);
        } else {
          throw newRuntimeError(
            "tee_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "set_global": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-global
        // $FlowIgnore
        const index = instruction.args[0];

        // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
        // $FlowIgnore
        const globaladdr = frame.originatingModule.globaladdrs[index.value];

        if (typeof globaladdr === "undefined") {
          // $FlowIgnore
          throw newRuntimeError(`Global address ${index.value} not found`);
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.allocator.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw newRuntimeError(
            `Unexpected data for global at ${globaladdr.toString()}`
          );
        }

        // 7. Pop the value val from the stack.
        const val = pop1(frame);

        // 8. Replace glob.value with the value val.
        globalinst.value = val.value;

        frame.allocator.set(globaladdr, globalinst);

        break;
      }

      case "get_global": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-global
        // $FlowIgnore
        const index = instruction.args[0];

        // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
        // $FlowIgnore
        const globaladdr = frame.originatingModule.globaladdrs[index.value];

        if (typeof globaladdr === "undefined") {
          throw newRuntimeError(
            // $FlowIgnore
            `Unknown global at index: ${index.value.toString()}`
          );
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.allocator.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw newRuntimeError(
            `Unexpected data for global at ${globaladdr.toString()}`
          );
        }

        // 7. Pop the value val from the stack.
        pushResult(frame, globalinst);

        break;
      }

      /**
       * Memory operations
       */

      // https://webassembly.github.io/spec/core/exec/instructions.html#exec-storen
      case "store":
      case "store8":
      case "store16":
      case "store32": {
        // $FlowIgnore
        const { id, object } = instruction;

        const memory = getMemory(frame);

        // $FlowIgnore
        const [c1, c2] = pop2(frame, "i32", object);
        const ptr = c1.value.toNumber() + getMemoryOffset(frame, instruction);
        let valueBuffer = c2.value.toByteArray();

        switch (id) {
          case "store":
            break;
          case "store8":
            valueBuffer = valueBuffer.slice(0, 1);
            break;
          case "store16":
            valueBuffer = valueBuffer.slice(0, 2);
            break;
          case "store32":
            valueBuffer = valueBuffer.slice(0, 4);
            break;

          default:
            throw newRuntimeError("illegal operation: " + id);
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
        // $FlowIgnore
        const { id, object } = instruction;

        const memory = getMemory(frame);

        const ptr =
          pop1OfType(frame, "i32").value.toNumber() +
          getMemoryOffset(frame, instruction);

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
          case "u32":
          case "i32":
          case "f32": {
            if (ptr + 4 > memory.buffer.byteLength) {
              throw newRuntimeError("memory access out of bounds");
            }
            break;
          }
          case "i64":
          case "f64": {
            if (ptr + 8 > memory.buffer.byteLength) {
              throw newRuntimeError("memory access out of bounds");
            }
            break;
          }

          default:
            // $FlowIgnore
            throw new RuntimeError("Unsupported " + object + " load");
        }

        switch (object) {
          case "i32":
          case "u32":
            pushResult(
              frame,
              i32.createValueFromArrayBuffer(memory.buffer, ptr, extend, signed)
            );
            break;
          case "i64":
            pushResult(
              frame,
              i64.createValueFromArrayBuffer(memory.buffer, ptr, extend, signed)
            );
            break;
          case "f32":
            pushResult(
              frame,
              f32.createValueFromArrayBuffer(memory.buffer, ptr)
            );
            break;
          case "f64":
            pushResult(
              frame,
              f64.createValueFromArrayBuffer(memory.buffer, ptr)
            );
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
      case "and": {
        let binopFn;
        // $FlowIgnore
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
                // $FlowIgnore
                instruction.object
            );
        }

        const [c1, c2] = pop2(frame, instruction.object, instruction.object);
        // $FlowIgnore
        pushResult(frame, binopFn(c1, c2, instruction.id));

        break;
      }

      /**
       * Comparison operations
       */
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
        // $FlowIgnore
        const [c1, c2] = pop2(frame, instruction.object, instruction.object);
        // $FlowIgnore
        pushResult(frame, compare(c1, c2, instruction.id));

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
            ? // $FlowIgnore
              instruction.id.split("/")[1]
            : // $FlowIgnore
              instruction.object;

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
              // $FlowIgnore
              "Unsupported operation " + instruction.id + " on " + opType
            );
        }

        const c = pop1OfType(frame, opType);

        // $FlowIgnore
        pushResult(frame, unopFn(c, instruction.id));

        break;
      }

      case "return": {
        if (frame.returnAddress !== -1) {
          pc = frame.returnAddress; // raw goto
          POP_STACK_FRAME();
        }

        RETURN();
      }
    }
  }
}
