// @flow

import { listOfInstructionsToIr } from "@webassemblyjs/helper-compiler";
import { assert } from "mamacro";

const t = require("@webassemblyjs/ast");

const { executeStackFrame } = require("./kernel/exec");
const { createStackFrame } = require("./kernel/stackframe");
const modulevalue = require("./runtime/values/module");

export function evaluate(
  allocator: Allocator,
  code: Array<Instruction>
): ?StackLocal {
  const ir = listOfInstructionsToIr(code);

  // Create an empty module instance for the context
  const moduleInstance = modulevalue.createInstance(
    ir,
    allocator,
    t.module(undefined, [])
  );

  const stackFrame = createStackFrame([], moduleInstance, allocator);

  const main = ir.funcTable.find(f => f.name === "main");
  assert(typeof main === "object");

  return executeStackFrame(ir, main.startAt, stackFrame);
}
