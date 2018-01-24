// @flow

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
const label = require("../runtime/values/label");
const { createChildStackFrame } = require("./stackframe");
const { createTrap, isTrapped } = require("./signals");
const { RuntimeError } = require("../../errors");
const t = require("../../compiler/AST");

// TODO(sven): can remove asserts call at compile to gain perf in prod
function assert(cond) {
  if (!cond) {
    throw new RuntimeError("Assertion error");
  }
}

function assertStackDepth(depth: number) {
  if (depth >= 300) {
    throw new RuntimeError("Maximum call stack depth reached");
  }
}

export function executeStackFrame(
  frame: StackFrame,
  depth: number = 0
): ?StackLocal {
  let pc = 0;

  function createAndExecuteChildStackFrame(
    instrs: Array<Instruction>
  ): ?StackLocal {
    const childStackFrame = createChildStackFrame(frame, instrs);
    childStackFrame.trace = frame.trace;

    return executeStackFrame(childStackFrame, depth + 1);
  }

  function getLocalByIndex(index: number) {
    const local = frame.locals[index];

    if (typeof local === "undefined") {
      throw new RuntimeError(
        "Assertion error: no local value at index " + index
      );
    }

    frame.values.push(local);
  }

  function setLocalByIndex(index: number, value: StackLocal) {
    assert(typeof index === "number");

    frame.locals[index] = value;
  }

  function pushResult(res: ?StackLocal) {
    if (res == null) {
      return;
    }

    frame.values.push(res);
  }

  function popArrayOfValTypes(types: Array<Valtype>): any {
    assertNItemsOnStack(frame.values, types.length);

    return types.map(type => {
      return pop1(type);
    });
  }

  function pop1(type: ?Valtype): any {
    assertNItemsOnStack(frame.values, 1);

    const v = frame.values.pop();

    if (typeof type === "string" && v.type !== type) {
      throw new RuntimeError(
        "Internal failure: expected value of type " +
          type +
          " on top of the stack, give type: " +
          v.type
      );
    }

    return v;
  }

  function pop2(type1: Valtype, type2: Valtype): [any, any] {
    assertNItemsOnStack(frame.values, 2);

    const c2 = frame.values.pop();
    const c1 = frame.values.pop();

    if (c2.type !== type2) {
      throw new RuntimeError(
        "Internal failure: expected c2 value of type " +
          type2 +
          " on top of the stack, give type: " +
          c2.type
      );
    }

    if (c1.type !== type2) {
      throw new RuntimeError(
        "Internal failure: expected c1 value of type " +
          type2 +
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

      // WATF
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
      throw new RuntimeError(`Label ${label.value} doesn't exist`);
    }

    // FIXME(sven): find a more generic way to handle label and its code
    // Currently func body and block instr*.
    const childStackFrame = createChildStackFrame(
      frame,
      code.body || code.instr
    );
    childStackFrame.trace = frame.trace;

    const res = executeStackFrame(childStackFrame, depth + 1);

    return res;
  }

  assertStackDepth(depth);

  while (pc < frame.code.length) {
    const instruction = frame.code[pc];

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
            frame.labels.push({
              value: func,
              arity: func.params.length,
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
          throw new RuntimeError("const requires one argument, none given.");
        }

        if (n.type !== "NumberLiteral" && n.type !== "LongNumberLiteral") {
          throw new RuntimeError("const: unsupported value of type: " + n.type);
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

        assert(
          typeof loop.instr === "object" &&
            typeof loop.instr.length !== "undefined"
        );

        // 2. Enter the block instr∗ with label
        frame.labels.push({
          value: loop,
          arity: 0,
          id: t.identifier("loop" + pc) // random
        });

        if (loop.instr.length > 0) {
          const childStackFrame = createChildStackFrame(frame, loop.instr);
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

          if (typeof res !== "undefined") {
            pushResult(res);
          }
        }

        break;
      }

      case "drop": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

        // 1. Assert: due to validation, a value is on the top of the stack.
        assertNItemsOnStack(frame.values, 1);

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
          throw new RuntimeError(
            "Internal compiler error: Identifier argument in call must be " +
              "transformed to a NumberLiteral node"
          );
        }

        // WASM
        if (call.index.type === "NumberLiteral") {
          const index = call.index.value;

          assert(typeof frame.originatingModule !== "undefined");

          // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
          const funcaddr = frame.originatingModule.funcaddrs[index];

          if (typeof funcaddr === "undefined") {
            throw new RuntimeError(
              `No function were found in module at address ${index}`
            );
          }

          // 3. Let a be the function address F.module.funcaddrs[x]

          const subroutine = frame.allocator.get(funcaddr);

          if (typeof subroutine !== "object") {
            throw new RuntimeError(
              `Cannot call function at address ${funcaddr}: not a function`
            );
          }

          // 4. Invoke the function instance at address a

          // FIXME(sven): assert that res has type of resultType
          const [argTypes, resultType] = subroutine.type;

          const args = popArrayOfValTypes(argTypes);

          if (subroutine.isExternal === false) {
            const childStackFrame = createChildStackFrame(
              frame,
              subroutine.code
            );
            childStackFrame.values = args.map(arg => arg.value);

            const res = executeStackFrame(childStackFrame, depth + 1);

            if (isTrapped(res)) {
              return res;
            }

            if (typeof res !== "undefined") {
              pushResult(res);
            }
          } else {
            const res = subroutine.code(args.map(arg => arg.value));

            pushResult(castIntoStackLocalOfType(resultType, res));
          }
        }

        break;
      }

      case "block": {
        const block = instruction;

        /**
         * Used to keep track of the number of values added on top of the stack
         * because we need to remove the label after the execution of this block.
         */
        let numberOfValuesAddedOnTopOfTheStack = 0;

        /**
         * When entering block push the label onto the stack
         */
        if (block.label.type === "Identifier") {
          pushResult(label.createValue(block.label.value));
        }

        assert(
          typeof block.instr === "object" &&
            typeof block.instr.length !== "undefined"
        );

        if (block.instr.length > 0) {
          const childStackFrame = createChildStackFrame(frame, block.instr);
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

          if (typeof res !== "undefined") {
            pushResult(res);
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
        const topOfTheStack = frame.values.slice(
          frame.values.length - numberOfValuesAddedOnTopOfTheStack
        );

        frame.values.splice(
          frame.values.length - numberOfValuesAddedOnTopOfTheStack
        );

        pop1("label");

        frame.values = [...frame.values, ...topOfTheStack];

        break;
      }

      case "br_if": {
        const [label] = instruction.args;

        // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
        // 2. Pop the value ci32.const c from the stack.
        const c = pop1("i32");

        if (!c.value.eqz().isTrue()) {
          // 3. If c is non-zero, then
          // 3. a. Execute the instruction (br l).
          const res = br(label);

          if (isTrapped(res)) {
            return res;
          }

          if (typeof res !== "undefined") {
            pushResult(res);
          }
        } else {
          // 4. Else:
          // 4. a. Do nothing.
        }

        break;
      }

      case "if": {
        /**
         * Execute test
         */
        const code = getLabel(instruction.testLabel);

        if (typeof code === "undefined") {
          throw new RuntimeError("IfInstruction: Label doesn't exist");
        }

        const childStackFrame = createChildStackFrame(frame, code.body);
        childStackFrame.trace = frame.trace;

        const res = executeStackFrame(childStackFrame, depth + 1);

        if (isTrapped(res)) {
          return res;
        }

        if (!res.value.eqz().isTrue()) {
          /**
           * Execute consequent
           */
          const childStackFrame = createChildStackFrame(
            frame,
            instruction.consequent
          );
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

          if (typeof res !== "undefined") {
            pushResult(res);
          }
        } else if (
          typeof instruction.alternate !== "undefined" &&
          instruction.alternate.length > 0
        ) {
          /**
           * Execute alternate
           */
          const childStackFrame = createChildStackFrame(
            frame,
            instruction.alternate
          );
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

          if (typeof res !== "undefined") {
            pushResult(res);
          }
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
        return createTrap();
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
          throw new RuntimeError(
            "get_local requires one argument, none given."
          );
        }

        if (index.type === "NumberLiteral") {
          getLocalByIndex(index.value);
        } else {
          throw new RuntimeError(
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

          const childStackFrame = createChildStackFrame(frame, [init]);
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

          setLocalByIndex(index.value, res);
        } else if (index.type === "NumberLiteral") {
          // WASM

          // 4. Pop the value val from the stack
          const val = pop1();

          // 5. Replace F.locals[x] with the value val
          setLocalByIndex(index.value, val);
        } else {
          throw new RuntimeError(
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

          const childStackFrame = createChildStackFrame(frame, [init]);
          childStackFrame.trace = frame.trace;

          const res = executeStackFrame(childStackFrame, depth + 1);

          if (isTrapped(res)) {
            return res;
          }

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
          throw new RuntimeError(
            "tee_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "set_global": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-global
        const index = instruction.args[0];

        // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
        const globaladdr = frame.originatingModule.globaladdrs[index];

        if (typeof globaladdr === "undefined") {
          throw new RuntimeError(`Global address ${index} not found`);
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.allocator.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw new RuntimeError(`Unexpected data for global at ${globaladdr}`);
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
        const globaladdr = frame.originatingModule.globaladdrs[index];

        if (typeof globaladdr === "undefined") {
          throw new RuntimeError(`Global address ${index} not found`);
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.allocator.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw new RuntimeError(`Unexpected data for global at ${globaladdr}`);
        }

        // 7. Pop the value val from the stack.
        pushResult(globalinst);

        break;
      }

      case "return": {
        const { args } = instruction;

        if (args.length > 0) {
          const res = createAndExecuteChildStackFrame(args);

          if (isTrapped(res)) {
            return res;
          }

          pushResult(res);
        }

        // Abort execution and return the first item on the stack
        return pop1();
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
            throw new RuntimeError(
              "Unsupported operation " +
                instruction.id +
                " on " +
                instruction.object
            );
        }

        const [left, right] = instruction.args;

        // Interpret left branch first if it's a child instruction
        if (typeof left !== "undefined") {
          const res = createAndExecuteChildStackFrame([left]);

          if (isTrapped(res)) {
            return res;
          }

          pushResult(res);
        }

        // Interpret right branch first if it's a child instruction
        if (typeof right !== "undefined") {
          const res = createAndExecuteChildStackFrame([right]);

          if (isTrapped(res)) {
            return res;
          }

          pushResult(res);
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
      case "eqz": {
        let unopFn;

        switch (instruction.object) {
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
            throw new RuntimeError(
              "Unsupported operation " +
                instruction.id +
                " on " +
                instruction.object
            );
        }

        const c = pop1(instruction.object);

        pushResult(unopFn(c, instruction.id));

        break;
      }
    }

    if (typeof frame.trace === "function") {
      frame.trace(depth, pc, instruction);
    }

    pc++;
  }

  // Return the item on top of the values/stack;
  if (frame.values.length > 0) {
    return pop1();
  }
}

function assertNItemsOnStack(stack: Array<any>, numberOfItem: number) {
  if (stack.length < numberOfItem) {
    throw new RuntimeError(
      "Assertion error: expected " +
        numberOfItem +
        " on the stack, found " +
        stack.length
    );
  }
}
