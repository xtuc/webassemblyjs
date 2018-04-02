import { traverse } from "@webassemblyjs/ast";

let errors = [];

const ANY = "ANY";

function checkTypes(a, b) {
  if (a !== ANY && b !== ANY && a !== b) {
    errors.push(`Expected type ${a} but got ${b || "none"}.`);
  }
}

export default function validate(ast) {
  errors = [];

  traverse(ast, {
    Func(path) {
      const expectedResult = path.node.result;

      const resultingStack = path.node.body.reduce(
        applyInstruction,
        path.node.params
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

function applyInstruction(stack, instruction) {
  // Workaround for node.args which sometimes does not contain instructions (i32.const, call)
  if (
    instruction.type !== "Instr" &&
    instruction.type !== "LoopInstruction" &&
    instruction.type !== "CallInstruction"
  ) {
    return stack;
  }

  // Recursively evaluate all nested instructions
  if (instruction.args) {
    stack = instruction.args.reduce(applyInstruction, stack);
  }

  const type = getType(instruction);

  // No type available for this instruction, skip the rest.
  if (stack === false || type === false) {
    return false;
  }

  let actual;

  type.args.forEach(argType => {
    actual = stack.pop() || "none";
    checkTypes(argType, actual);
  });

  stack = [...stack, ...type.result];

  return stack;
}

function getType(instruction) {
  let args = [];
  let result = [];

  switch (instruction.id) {
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
