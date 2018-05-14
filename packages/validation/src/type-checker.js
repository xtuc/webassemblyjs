import { traverse } from "@webassemblyjs/ast";

import ModuleContext from "./type-checker/module-context.js";
import getType from "./type-checker/get-type.js";
import { ANY, POLYMORPHIC } from "./type-checker/types.js";

let errors = [];
let stopFuncCheck = false;

function checkTypes(a, b) {
  if (a === ANY && b) {
    return;
  }

  if (b === ANY && a) {
    return;
  }

  // the type u32 is equal to i32
  if (a === "u32") a = "i32";
  if (b === "u32") b = "i32";

  // the type u64 is equal to i64
  if (a === "u64") a = "i64";
  if (b === "u64") b = "i64";

  if (a !== b) {
    errors.push(`Expected type ${a} but got ${b || "none"}.`);
    stopFuncCheck = true;
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
        moduleContext.addFunction(field.signature);
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
          case "FuncImportDescr": {
            moduleContext.importFunction(field.descr.signature);
            break;
          }

          case "Table": {
            // FIXME(sven): not implemented yet
            break;
          }

          default:
            throw new Error(
              "Unsupported ModuleImport of type " +
                JSON.stringify(field.descr.type)
            );
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
    Func({ node }) {
      stopFuncCheck = false;
      const expectedResult = node.signature.results;

      moduleContext.newContext(node.name.value, expectedResult);

      // Parameters are local variables
      node.signature.params.forEach(p => moduleContext.addLocal(p.valtype));

      const resultingStack = node.body.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      );

      if (stopFuncCheck) {
        return;
      }

      // Compare the two
      checkStacks(expectedResult, resultingStack);
    }
  });

  return errors;
}

function checkStacks(expectedStack, actualStack) {
  if (actualStack !== false) {
    let j = actualStack.length - 1;
    for (let i = 0; i < expectedStack.length; ++i) {
      const expected = expectedStack[i];
      const actual = actualStack[j];

      if (actual === POLYMORPHIC || stopFuncCheck) {
        return;
      }

      checkTypes(expected, actual);
      --j;
    }

    // There are still types left on the resulting stack
    if (j >= 0) {
      errors.push(
        `Stack contains additional type ${actualStack.slice(0, j + 1)}.`
      );
    }
  }
}

function applyInstruction(moduleContext, stack, instruction) {
  // Return was called, skip everything
  if (stack === false || stack.return) {
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

  const type = getType(moduleContext, stack, instruction);

  if (type.error) {
    errors.push(type.error);
    return false;
  }

  // Structured control flow
  // Update context
  // Run on empty stack
  if (
    instruction.type === "BlockInstruction" ||
    instruction.type === "LoopInstruction"
  ) {
    moduleContext.addLabel(type.result);

    const newStack = instruction.instr.reduce(
      applyInstruction.bind(null, moduleContext),
      []
    );

    if (!stopFuncCheck) {
      checkStacks(type.result, newStack);
    }
    stack = [...stack, ...newStack];

    moduleContext.popLabel();
  } else if (instruction.type === "IfInstruction") {
    moduleContext.addLabel(type.result);

    // Condition can be nested as well
    if (instruction.test) {
      stack = instruction.test.reduce(
        applyInstruction.bind(null, moduleContext),
        stack
      );
    }

    let actual;
    for (let i = 0; i < type.args.length; ++i) {
      const argType = type.args[i];

      if (stack[stack.length - 1] === POLYMORPHIC || stopFuncCheck) {
        return false;
      }

      actual = stack.pop();
      checkTypes(argType, actual);
    }

    const stackConsequent = instruction.consequent.reduce(
      applyInstruction.bind(null, moduleContext),
      []
    );

    const stackAlternate = instruction.alternate.reduce(
      applyInstruction.bind(null, moduleContext),
      []
    );

    let i = 0;
    let j = 0;
    let compareLengths = true;
    while (i < stackConsequent.length && j < stackAlternate.length) {
      if (
        stackConsequent[i] === POLYMORPHIC ||
        stackAlternate[j] === POLYMORPHIC
      ) {
        compareLengths = false;
        break;
      }

      checkTypes(stackConsequent[i], stackAlternate[j]);
      ++i;
      ++j;
    }

    while (compareLengths && i < stackConsequent.length) {
      if (stackConsequent[i] === POLYMORPHIC) {
        compareLengths = false;
      }
      ++i;
    }

    while (compareLengths && j < stackConsequent.length) {
      if (stackConsequent[j] === POLYMORPHIC) {
        compareLengths = false;
      }
      ++j;
    }

    if (compareLengths && stackConsequent.length !== stackAlternate.length) {
      errors.push(
        `Type mismatch in if, got ${stackConsequent} and ${stackAlternate}`
      );
    }

    checkStacks(type.result, stackConsequent);

    moduleContext.popLabel();

    // Add to existing stack
    stack = [...stack, ...stackConsequent];
  } else if (instruction.id === "return") {
    stack.return = true;
    return stack;
  } else {
    let actual;
    for (let i = 0; i < type.args.length; ++i) {
      const argType = type.args[i];

      if (stack[stack.length - 1] === POLYMORPHIC || stopFuncCheck) {
        return false;
      }

      actual = stack.pop();
      checkTypes(argType, actual);
    }

    stack = [...stack, ...type.result];
  }

  return stack;
}
