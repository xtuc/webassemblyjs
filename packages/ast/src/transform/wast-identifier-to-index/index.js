// @flow

import { traverse } from "../../index";

// FIXME(sven): do the same with all block instructions, must be more generic here

const t = require("../../index");

export function transform(ast: Program) {
  const functionsInProgram: Array<Index> = [];
  const globalsInProgram: Array<Index> = [];

  // First collect the indices of all the functions in the Program
  traverse(ast, {
    ModuleImport({ node }: NodePath<ModuleImport>) {
      functionsInProgram.push(t.identifier(node.name));
    },

    Global({ node }: NodePath<Global>) {
      if (node.name != null) {
        globalsInProgram.push(node.name);
      }
    },

    Func({ node }: NodePath<Func>) {
      if (node.name == null) {
        return;
      }

      functionsInProgram.push(node.name);
    }
  });

  // Transform the actual instruction in function bodies
  traverse(ast, {
    Func(path: NodePath<Func>) {
      transformFuncPath(path, functionsInProgram, globalsInProgram);
    },

    Start(path: NodePath<Start>) {
      const index = path.node.index;

      const offsetInFunctionsInProgram = functionsInProgram.findIndex(
        ({ value }) => value === index.value
      );

      if (offsetInFunctionsInProgram === -1) {
        throw new Error("unknown function");
      }

      const indexNode = t.indexLiteral(offsetInFunctionsInProgram);

      // Replace the index Identifier
      path.node.index = indexNode;
    }
  });
}

function transformFuncPath(
  funcPath: NodePath<Func>,
  functionsInProgram: Array<Index>,
  globalsInProgram: Array<Index>
) {
  const funcNode = funcPath.node;

  const signature = funcNode.signature;
  if (signature.type !== "Signature") {
    throw new Error(
      "Function signatures must be denormalised before execution"
    );
  }
  const params = signature.params;

  traverse(funcNode, {
    Instr(instrPath: NodePath<GenericInstruction>) {
      const instrNode = instrPath.node;

      if (
        instrNode.id === "get_local" ||
        instrNode.id === "set_local" ||
        instrNode.id === "tee_local"
      ) {
        const [firstArg] = instrNode.args;

        if (firstArg.type === "Identifier") {
          const offsetInParams = params.findIndex(
            ({ id }) => id === firstArg.value
          );

          if (offsetInParams === -1) {
            throw new Error(
              `${firstArg.value} not found in ${
                instrNode.id
              }: not declared in func params`
            );
          }

          const indexNode = t.indexLiteral(offsetInParams);

          // Replace the Identifer node by our new NumberLiteral node
          instrNode.args[0] = indexNode;
        }
      }

      if (instrNode.id === "get_global" || instrNode.id === "set_global") {
        const [firstArg] = instrNode.args;

        if (firstArg.type === "Identifier") {
          const offsetInGlobalsInProgram = globalsInProgram.findIndex(
            ({ value }) => value === firstArg.value
          );

          if (offsetInGlobalsInProgram === -1) {
            throw new Error(`global ${firstArg.value} not found in module`);
          }

          const indexNode = t.indexLiteral(offsetInGlobalsInProgram);

          // Replace the Identifer node by our new NumberLiteral node
          instrNode.args[0] = indexNode;
        }
      }
    },

    CallInstruction({ node }: NodePath<CallInstruction>) {
      const index = node.index;

      if (index.type === "Identifier") {
        const offsetInFunctionsInProgram = functionsInProgram.findIndex(
          ({ value }) => value === index.value
        );

        if (offsetInFunctionsInProgram === -1) {
          throw new Error(
            `${
              index.value
            } not found in CallInstruction: not declared in Program`
          );
        }

        const indexNode = t.indexLiteral(offsetInFunctionsInProgram);

        // Replace the index Identifier
        node.index = indexNode;
      }
    }
  });
}
