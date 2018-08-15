import { ANY, POLYMORPHIC } from "./types";

function equalResultTypes(t1, t2) {
  if (t1.length !== t2.length) {
    return false;
  }

  return t1.every((t, i) => t === t2[i]);
}

export default function getType(moduleContext, stack, instruction) {
  let args = [];
  let result = [];
  let error;

  switch (instruction.id) {
    /**
     * This is actually not an instruction, but we parse it as such.
     * We skip over it by treating it as `nop` here.
     */
    case "local": {
      instruction.args.forEach(t => moduleContext.addLocal(t.name));
      args = [];
      result = [];
      break;
    }
    case "select": {
      if (stack.length < 3) {
        error = `Stack contains too few arguments for select`;
        break;
      }
      const first = stack[stack.length - 2];
      const second = stack[stack.length - 3];
      if (first !== second) {
        error = `Type mismatch in select`;
        break;
      }
      args = ["i32", first, first];
      result = [first];
      break;
    }
    /**
     * get_global
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-get-global
     */
    case "get_global": {
      const index = instruction.args[0].value;
      if (!moduleContext.hasGlobal(index)) {
        error = `Module does not have global ${index}`;
        break;
      }
      args = [];
      result = [moduleContext.getGlobal(index)];
      break;
    }
    /**
     * set_global
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-set-global
     */
    case "set_global": {
      const index = instruction.args[0].value;
      if (!moduleContext.hasGlobal(index)) {
        error = `Module does not have global ${index}`;
        break;
      }
      if (!moduleContext.isMutableGlobal(index)) {
        error = "global is immutable";
        break;
      }
      args = [moduleContext.getGlobal(index)];
      result = [];
      break;
    }
    /**
     * set_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-set-local
     */
    case "set_local": {
      const index = instruction.args[0].value;
      if (!moduleContext.hasLocal(index)) {
        error = `Function does not have local ${index}`;
        break;
      }
      args = [moduleContext.getLocal(index)];
      result = [];
      break;
    }
    /**
     * tee_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-tee-local
     */
    case "tee_local": {
      const index = instruction.args[0].value;
      if (!moduleContext.hasLocal(index)) {
        error = `Function does not have local ${index}`;
        break;
      }
      args = [moduleContext.getLocal(index)];
      result = [moduleContext.getLocal(index)];
      break;
    }
    /**
     * get_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-get-local
     */
    case "get_local": {
      const index = instruction.args[0].value;
      if (!moduleContext.hasLocal(index)) {
        error = `Function does not have local ${index}`;
        break;
      }
      args = [];
      result = [moduleContext.getLocal(index)];
      break;
    }
    /**
     * block
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-block
     */
    case "block": {
      args = [];
      result = instruction.result ? [instruction.result] : [];
      break;
    }
    /**
     * if
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-if
     */
    case "if": {
      args = ["i32"];
      result = instruction.result ? [instruction.result] : [];
      break;
    }
    /**
     * nop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-nop
     */
    case "nop": {
      args = [];
      result = [];
      break;
    }
    /**
     * loop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-loop
     */
    case "loop": {
      args = [];
      result = instruction.resulttype ? [instruction.resulttype] : [];
      break;
    }
    /**
     * call
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-call
     */
    case "call": {
      if (!moduleContext.hasFunction(instruction.index.value)) {
        error = `Call to undefined function index ${instruction.index.value}.`;
        break;
      }

      ({ args, result } = moduleContext.getFunction(instruction.index.value));

      break;
    }
    /**
     * const
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-const
     */
    case "const": {
      args = [];
      result = [instruction.object];
      break;
    }
    /**
     * drop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-const
     */
    case "drop": {
      args = [ANY];
      result = [];
      break;
    }
    /**
     * unop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-unop
     */
    case "clz":
    case "ctz":
    case "popcnt":
    case "abs":
    case "neg":
    case "sqrt":
    case "ceil":
    case "floor":
    case "trunc":
    case "nearest": {
      args = [instruction.object];
      result = [instruction.object];
      break;
    }
    /**
     * binop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-binop
     */
    case "add":
    case "sub":
    case "mul":
    case "div":
    case "min":
    case "max":
    case "copysign":
    case "div_u":
    case "div_s":
    case "rem_u":
    case "rem_s":

    case "and":
    case "or":
    case "xor":
    case "shl":
    case "shr_u":
    case "shr_s":
    case "rotl":
    case "rotr": {
      args = [instruction.object, instruction.object];
      result = [instruction.object];
      break;
    }
    /**
     * testop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-testop
     */
    case "eqz": {
      args = [instruction.object];
      result = ["i32"];
      break;
    }
    /**
     * relop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-relop
     */
    case "eq":
    case "ne":
    case "lt_u":
    case "lt_s":
    case "lt":
    case "gt_u":
    case "gt_s":
    case "gt":
    case "le_u":
    case "le_s":
    case "le":
    case "ge_u":
    case "ge_s":
    case "ge": {
      args = [instruction.object, instruction.object];
      result = ["i32"];
      break;
    }
    /**
     * cvtop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-cvtop
     */
    case "wrap/i64":
    case "convert_s/i64":
    case "convert_u/i64":
    case "reinterpret/i64": {
      args = ["i64"];
      result = [instruction.object];
      break;
    }
    case "promote/f32":
    case "trunc_u/f32":
    case "trunc_s/f32":
    case "convert_s/f32":
    case "convert_u/f32":
    case "reinterpret/f32": {
      args = ["f32"];
      result = [instruction.object];
      break;
    }
    case "demote/f64":
    case "trunc_u/f64":
    case "trunc_s/f64":
    case "convert_s/f64":
    case "convert_u/f64":
    case "reinterpret/f64": {
      args = ["f64"];
      result = [instruction.object];
      break;
    }
    case "extend_u/i32":
    case "extend_s/i32":
    case "convert_s/i32":
    case "convert_u/i32":
    case "reinterpret/i32": {
      args = ["i32"];
      result = [instruction.object];
      break;
    }
    /**
     * br
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-br
     */
    case "br": {
      const index = instruction.args[0].value;
      if (!moduleContext.getLabel(index)) {
        error = `Label ${index} does not exist`;
        break;
      }
      args = moduleContext.getLabel(index);
      result = [POLYMORPHIC];
      break;
    }
    /**
     * br_if
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-br-if
     */
    case "br_if": {
      const index = instruction.args[0].value;
      if (!moduleContext.getLabel(index)) {
        error = `Label ${index} does not exist`;
        break;
      }
      args = [...moduleContext.getLabel(index), "i32"];
      result = moduleContext.getLabel(index);
      break;
    }
    /**
     * load
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-load
     */
    case "load":
    case "load8_u":
    case "load8_s":
    case "load16_u":
    case "load16_s":
    case "load32_u":
    case "load32_s": {
      if (!moduleContext.hasMemory(0)) {
        error = `Module does not have memory 0`;
        break;
      }
      // TODO Alignment check
      args = ["i32"];
      result = [instruction.object];
      break;
    }
    /**
     * store
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-store
     */
    case "store":
    case "store8":
    case "store16":
    case "store32": {
      if (!moduleContext.hasMemory(0)) {
        error = `Module does not have memory 0`;
        break;
      }
      // TODO Alignment check
      args = [instruction.object, "i32"];
      result = [];
      break;
    }
    /**
     * return
     */
    case "return": {
      args = moduleContext.return;
      result = [POLYMORPHIC];
      stack.return = true;
      break;
    }
    /**
     * unreachable, trap
     */
    case "unreachable":
    case "trap": {
      // TODO: These should be polymorphic
      args = [];
      result = [];
      break;
    }
    /**
     * memory.size
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-memory-size
     */
    case "size":
    case "current_memory": {
      if (!moduleContext.hasMemory(0)) {
        error = `Module does not have memory 0`;
        break;
      }
      args = [];
      result = ["i32"];
      break;
    }
    /**
     * memory.grow
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-memory-grow
     */
    case "grow":
    case "grow_memory": {
      if (!moduleContext.hasMemory(0)) {
        error = `Module does not have memory 0`;
        break;
      }
      args = ["i32"];
      result = ["i32"];
      break;
    }
    /**
     * br_table
     */
    case "br_table": {
      // TODO: Read all labels not just one
      const index = instruction.args[0].value;
      if (!moduleContext.hasLabel(index)) {
        error = `Module does not have memory ${index}`;
        break;
      }

      const t = moduleContext.getLabel(index);

      let validLabels = true;

      for (let i = 1; i < instruction.args.length; ++i) {
        const arg = instruction.args[i];
        if (arg.type === "Instr") {
          // No more indices, only nested instructions
          break;
        }

        const index = arg.value;

        if (!moduleContext.hasLabel(index)) {
          error = `Module does not have memory ${index}`;
          validLabels = false;
          break;
        }

        if (!equalResultTypes(moduleContext.getLabel(index), t)) {
          error = `br_table index ${index} at position ${i} has mismatching result type.`;
          validLabels = false;
          break;
        }
      }

      if (!validLabels) {
        break;
      }

      args = [...t, "i32"];
      result = [POLYMORPHIC];
      break;
    }
    /**
     * call_indirect
     */
    case "call_indirect": {
      // TODO: There are more things to be checked here
      args = [...instruction.signature.params.map(p => p.valtype), "i32"];
      result = instruction.signature.results.map(p => p.valtype);
      break;
    }
    /**
     * Skip type checking
     */
    default: {
      throw new Error(`Unknown instruction ${instruction.id}.`);
      break;
    }
  }

  return {
    args,
    result,
    error
  };
}
