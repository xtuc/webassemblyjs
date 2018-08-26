// @flow

import { traverse } from "@webassemblyjs/ast";
import { flatten } from "@webassemblyjs/helper-flatten-ast";

import { Module } from "./module";

export function toIR(ast: Program): IR {
  const program = {};
  const funcTable = [];

  // flatten the ast first
  // TODO(sven): do it in a single pass?
  flatten(ast);

  const module = new Module(ast);

  traverse(ast, {
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
    funcTable,
    program
  };
}

export * from "./printer";
