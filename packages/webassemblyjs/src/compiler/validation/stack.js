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
    this.func = new Map();
    this.labels = [];
    this.funcCount = 0;
  }

  addFunction({ params: args, result }) {
    args = args.map(arg => arg.valtype);
    this.func.set(this.funcCount++, { args, result });
  }

  addLabel(result) {
    this.labels.unshift(result);
  }
}

export default function validate(ast) {
  // Module context
  const moduleContext = new ModuleContext();

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
  // Workaround for node.args which sometimes does not contain instructions (i32.const, call)
  if (
    instruction.type !== "Instr" &&
    instruction.type !== "LoopInstruction" &&
    instruction.type !== "CallInstruction" &&
    instruction.type !== "BlockInstruction"
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
     * block
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-block
     */
    case "block": {
      args = [];
      result = instruction.result || [];
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
      if (!moduleContext.func.has(instruction.index.value)) {
        errors.push(
          `Call to undefined function index ${instruction.index.value}.`
        );
      }
      ({ args, result } = moduleContext.func.get(instruction.index.value));
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
