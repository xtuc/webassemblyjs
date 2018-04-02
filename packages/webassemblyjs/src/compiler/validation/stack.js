import { traverse } from "@webassemblyjs/ast";

let errors = [];

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
          if (actual !== type) {
            errors.push(`Expected type ${type} but got ${actual}.`);
          }
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
    if (actual !== argType) {
      errors.push(`Expected type ${argType} but got ${actual}.`);
      return false;
    }
  });

  stack = [...stack, ...type.result];

  return stack;
}

function getType(instruction) {
  let args = [];
  let result = [];

  switch (instruction.id) {
    case "const": {
      args = [];
      result = [instruction.object];
      break;
    }
    case "add": {
      args = [instruction.object, instruction.object];
      result = [instruction.object];
      break;
    }
    default: {
      return false;
    }
  }

  return {
    args,
    result
  };
}
