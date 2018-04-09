import { traverse } from "@webassemblyjs/ast";

let errors = [];

const ANY = "ANY";

function checkTypes(a, b) {
  if (a === ANY && b) {
    return;
  }

  if (b === ANY && a) {
    return;
  }

  if (a !== b) {
    errors.push(`Expected type ${a} but got ${b || "none"}.`);
  }
}

class ModuleContext {
  constructor() {
    this.funcs = [];
    this.globals = [];
    this.mems = [];

    // Current stack frame
    this.locals = [];
    this.labels = [];
  }

  resetStackFrame() {
    this.locals = [];
    this.labels = [];
  }

  /**
   * Functions
   */
  addFunction({ params: args, result }) {
    args = args.map(arg => arg.valtype);
    this.funcs.push({ args, result });
  }

  hasFunction(index) {
    return this.funcs.length > index && index >= 0;
  }

  getFunction(index) {
    return this.funcs[index];
  }

  /**
   * Labels
   */
  addLabel(result) {
    this.labels.unshift(result);
  }

  hasLabel(index) {
    return this.labels.length > index && index >= 0;
  }

  getLabel(index) {
    return this.labels[index];
  }

  /**
   * Locals
   */
  hasLocal(index) {
    return this.locals.length > index && index >= 0;
  }

  getLocal(index) {
    return this.locals[index];
  }

  addLocal(type) {
    this.locals.push(type);
  }

  /**
   * Globals
   */
  hasGlobal(index) {
    return this.globals.length > index && index >= 0;
  }

  getGlobal(index) {
    return this.globals[index].type;
  }

  defineGlobal(type, mutability) {
    this.globals.push({ type, mutability });
  }

  importGlobal(type, mutability) {
    this.globals.unshift({ type, mutability });
  }

  isMutableGlobal(index) {
    return this.globals[index].mutability === "var";
  }

  /**
   * Memories
   */
  hasMemory(index) {
    return this.mems.length > index && index >= 0;
  }

  addMemory(min, max) {
    this.mems.push({ min, max });
  }

  getMemory(index) {
    return this.mems[index];
  }
}

export default function validate(ast) {
  // Module context
  const moduleContext = new ModuleContext();

  if (!ast.body || !ast.body[0] || !ast.body[0].fields) {
    return [];
  }

  ast.body[0].fields.forEach(field => {
    switch (field.type) {
      case "Func": {
        moduleContext.addFunction(field);
        break;
      }
      case "Global": {
        moduleContext.defineGlobal(field.globalType.valtype, field.mutability);
        break;
      }
      case "ModuleImport": {
        switch (field.descr.type) {
          case "GlobalType": {
            moduleContext.importGlobal(field.descr.valtype);
            break;
          }
          case "Memory": {
            moduleContext.addMemory(
              field.descr.limits.min,
              field.descr.limits.max
            );
            break;
          }
        }
        break;
      }
      case "Memory": {
        moduleContext.addMemory(field.limits.min, field.limits.max);
        break;
      }
    }
  });

  errors = [];

  // Simulate stack types throughout all function bodies
  traverse(ast, {
    Func(path) {
      const expectedResult = path.node.result;

      moduleContext.resetStackFrame();

      // Parameters are local variables
      path.node.params.forEach(p => moduleContext.addLocal(p.valtype));

      const resultingStack = path.node.body.reduce(
        applyInstruction.bind(null, moduleContext),
        path.node.params.map(arg => arg.valtype)
      );

      // Compare the two
      let actual;
      if (resultingStack !== false) {
        expectedResult.map((type, i) => {
          actual = resultingStack[resultingStack.length - 1 - i];
          checkTypes(type, actual);
        });
      }
    }
  });

  return errors;
}

function applyInstruction(moduleContext, stack, instruction) {
  // Return was called, skip everything
  if (stack.return) {
    return stack;
  }

  // Workaround for node.args which sometimes does not contain instructions (i32.const, call)
  if (
    instruction.type !== "Instr" &&
    instruction.type !== "LoopInstruction" &&
    instruction.type !== "CallInstruction" &&
    instruction.type !== "BlockInstruction" &&
    instruction.type !== "IfInstruction"
  ) {
    return stack;
  }

  const type = getType(moduleContext, stack, instruction);

  // Structured control flow
  // Update context
  // Run on empty stack
  if (
    instruction.type === "BlockInstruction" ||
    instruction.type === "LoopInstruction"
  ) {
    moduleContext.addLabel(type.result);

    stack = [
      ...stack,
      ...instruction.instr.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      )
    ];
  }

  // Used for branches
  if (instruction.type === "IfInstruction") {
    moduleContext.addLabel(type.result);

    const stackConsequent = [
      ...stack,
      ...instruction.consequent.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      )
    ];

    const stackAlternate = [
      ...stack,
      ...instruction.alternate.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      )
    ];

    // Compare the two branches
    if (stackConsequent.length !== stackAlternate.length) {
      errors.push(
        `Type mismatch in if, got ${stackConsequent} and ${stackAlternate}`
      );
    }
    stackConsequent.forEach((x, i) => x === checkTypes(x, stackAlternate[i]));

    // Add to existing stack
    stack = [...stack, ...stackConsequent];
  }

  // Recursively evaluate all nested instructions
  if (instruction.args) {
    stack = instruction.args.reduce(
      applyInstruction.bind(null, moduleContext),
      stack
    );
  }

  if (instruction.instrArgs) {
    stack = instruction.instrArgs.reduce(
      applyInstruction.bind(null, moduleContext),
      stack
    );
  }

  if (instruction.id === "return") {
    stack.return = true;
    return stack;
  }

  // No type available for this instruction, skip the rest.
  if (stack === false || type === false) {
    return false;
  }

  let actual;

  type.args.forEach(argType => {
    actual = stack.pop();
    checkTypes(argType, actual);
  });

  stack = [...stack, ...type.result];

  return stack;
}

function getType(moduleContext, stack, instruction) {
  let args = [];
  let result = [];

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
        errors.push(`Stack contains too few arguments for select`);
        return false;
      }
      const first = stack[stack.length - 2];
      const second = stack[stack.length - 3];
      if (first !== second) {
        errors.push(`Type mismatch in select`);
        return false;
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
        errors.push(`Module does not have global ${index}`);
        return false;
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
        errors.push(`Module does not have global ${index}`);
        return false;
      }
      if (!moduleContext.isMutableGlobal(index)) {
        errors.push(`Global ${index} is immutable`);
        return false;
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
        errors.push(`Function does not have local ${index}`);
        return false;
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
        errors.push(`Function does not have local ${index}`);
        return false;
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
        errors.push(`Function does not have local ${index}`);
        return false;
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
        errors.push(
          `Call to undefined function index ${instruction.index.value}.`
        );
        return false;
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
    case "rot_l":
    case "rot_r": {
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
        errors.push(`Label ${index} does not exist`);
        return false;
      }
      args = moduleContext.getLabel(index);
      result = []; // Technically arbitrary but we don't implement that currently
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
        errors.push(`Label ${index} does not exist`);
        return false;
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
        errors.push(`Module does not have memory 0`);
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
        errors.push(`Module does not have memory 0`);
      }
      // TODO Alignment check
      args = [instruction.object, "i32"];
      result = [];
      break;
    }
    /**
     * Skip type checking
     */
    default: {
      return false;
    }
  }

  return {
    args,
    result
  };
}
