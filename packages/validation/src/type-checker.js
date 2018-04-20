import { traverse } from "@webassemblyjs/ast";

import ModuleContext from "./type-checker/module-context.js";
import getType from "./type-checker/get-type.js";
import { ANY } from "./type-checker/types.js";

let errors = [];

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
      const expectedResult = path.node.signature.results;

      moduleContext.resetStackFrame(expectedResult);

      // Parameters are local variables
      path.node.signature.params.forEach(p =>
        moduleContext.addLocal(p.valtype)
      );

      const resultingStack = path.node.body.reduce(
        applyInstruction.bind(null, moduleContext),
        path.node.signature.params.map(arg => arg.valtype)
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

    stack = [
      ...stack,
      ...instruction.instr.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      )
    ];

    moduleContext.popLabel();
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

    moduleContext.popLabel();

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
