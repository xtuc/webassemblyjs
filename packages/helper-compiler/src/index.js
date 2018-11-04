// @flow

import {
  traverse,
  identifier,
  func,
  program as tProgram
} from "@webassemblyjs/ast";
import { flatten } from "@webassemblyjs/helper-flatten-ast";

import { Module } from "./module";

export { kStart } from "./module";

export function toIR(ast: Program): IR {
  const program = {};
  const funcTable = [];

  // flatten the ast first
  // TODO(sven): do it in a single pass?
  flatten(ast);

  const module = new Module(ast);

  traverse(ast, {
    Start({ node }: NodePath<Start>) {
      const { name, startAt } = module.emitStartFunc(
        parseInt(node.index.value)
      );

      funcTable.push({ name, startAt });
    },

    Func(funcPath: NodePath<Func>) {
      module.beginFuncBody(funcPath.node);

      traverse(funcPath.node, {
        Instruction(path: NodePath<Instruction>) {
          module.onFuncInstruction(path.node);
        }
      });

      const { name, instructions, startAt } = module.finalizeFunc(
        funcPath.node
      );

      funcTable.push({ name, startAt });

      instructions.forEach(instruction => {
        program[instruction.offset] = instruction.node;
      });
    }
  });

  return {
    // $FlowIgnore
    funcTable,
    program
  };
}

export function listOfInstructionsToIr(instrs: Array<Instruction>): IR {
  const program = {};
  const funcTable = [];

  const module = new Module(tProgram([]));
  const fakeFunc = func(identifier("main"), [], instrs);

  module.beginFuncBody(fakeFunc);

  instrs.forEach(i => module.onFuncInstruction(i));

  const { name, instructions, startAt } = module.finalizeFunc(fakeFunc);

  funcTable.push({ name, startAt });

  instructions.forEach(instruction => {
    program[instruction.offset] = instruction.node;
  });

  return {
    // $FlowIgnore
    funcTable,
    program
  };
}

export * from "./printer";
