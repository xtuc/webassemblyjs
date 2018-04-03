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
    this.labels = [];

    // Current stack frame
    this.locals = [];
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
}

export default function validate(ast) {
  // Module context
  const moduleContext = new ModuleContext();

  // Collect indices for funcs and globals
  // TODO: This assumes `traverse` runs in program order which is probably wrong
  traverse(ast, {
    Func(path) {
      moduleContext.addFunction(path.node);
    }
  });

  errors = [];

  // Simulate stack types throughout all function bodies
  traverse(ast, {
    Func(path) {
      const expectedResult = path.node.result;

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

  const type = getType(moduleContext, instruction);

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

function getType(moduleContext, instruction) {
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
