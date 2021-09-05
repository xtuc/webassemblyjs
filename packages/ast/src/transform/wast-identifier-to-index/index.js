// @flow

import {
  isBlock,
  isFunc,
  isIdentifier,
  numberLiteralFromRaw,
  traverse,
} from "../../index";
import {
  moduleContextFromModuleAST,
  type ModuleContext,
} from "../ast-module-to-module-context";

// FIXME(sven): do the same with all block instructions, must be more generic here

function newUnexpectedFunction(i) {
  return new Error("unknown function at offset: " + i);
}

export function transform(ast: Program) {
  let module = null;

  traverse(ast, {
    Module(path: NodePath<Module>) {
      module = path.node;
    },
  });

  if (module == null) {
    throw new Error("Module not foudn in program");
  }
  const moduleContext = moduleContextFromModuleAST(module);

  // Transform the actual instruction in function bodies
  traverse(ast, {
    Func(path: NodePath<Func>) {
      transformFuncPath(path, moduleContext);
    },

    Start(path: NodePath<Start>) {
      const index = path.node.index;

      if (isIdentifier(index) === true) {
        const offsetInModule = moduleContext.getFunctionOffsetByIdentifier(
          index.value
        );

        if (typeof offsetInModule === "undefined") {
          throw newUnexpectedFunction(index.value);
        }

        // Replace the index Identifier
        // $FlowIgnore: reference?
        path.node.index = numberLiteralFromRaw(offsetInModule);
      }
    },
  });
}

function transformFuncPath(
  funcPath: NodePath<Func>,
  moduleContext: ModuleContext
) {
  const funcNode = funcPath.node;

  const signature = funcNode.signature;
  if (signature.type !== "Signature") {
    throw new Error(
      "Function signatures must be denormalised before execution"
    );
  }

  const { params } = signature;

  // Add func locals in the context
  params.forEach((p) => moduleContext.addLocal(p.valtype));

  traverse(funcNode, {
    Instr(instrPath: NodePath<Instr>) {
      const instrNode = instrPath.node;

      /**
       * Local access
       */
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
              `${firstArg.value} not found in ${instrNode.id}: not declared in func params`
            );
          }

          // Replace the Identifer node by our new NumberLiteral node
          instrNode.args[0] = numberLiteralFromRaw(offsetInParams);
        }
      }

      /**
       * Global access
       */
      if (instrNode.id === "get_global" || instrNode.id === "set_global") {
        const [firstArg] = instrNode.args;

        if (isIdentifier(firstArg) === true) {
          const globalOffset = moduleContext.getGlobalOffsetByIdentifier(
            // $FlowIgnore: reference?
            firstArg.value
          );

          if (typeof globalOffset === "undefined") {
            // $FlowIgnore: reference?
            throw new Error(`global ${firstArg.value} not found in module`);
          }

          // Replace the Identifer node by our new NumberLiteral node
          instrNode.args[0] = numberLiteralFromRaw(globalOffset);
        }
      }

      /**
       * Labels lookup
       */
      if (instrNode.id === "br") {
        const [firstArg] = instrNode.args;

        if (isIdentifier(firstArg) === true) {
          // if the labels is not found it is going to be replaced with -1
          // which is invalid.
          let relativeBlockCount = -1;

          // $FlowIgnore: reference?
          instrPath.findParent(({ node }) => {
            if (isBlock(node)) {
              relativeBlockCount++;

              // $FlowIgnore: reference?
              const name = node.label || node.name;

              if (typeof name === "object") {
                // $FlowIgnore: isIdentifier ensures that
                if (name.value === firstArg.value) {
                  // Found it
                  return false;
                }
              }
            }

            if (isFunc(node)) {
              return false;
            }
          });

          // Replace the Identifer node by our new NumberLiteral node
          instrNode.args[0] = numberLiteralFromRaw(relativeBlockCount);
        }
      }
    },

    /**
     * Func lookup
     */
    CallInstruction({ node }: NodePath<CallInstruction>) {
      const index = node.index;

      if (isIdentifier(index) === true) {
        const offsetInModule = moduleContext.getFunctionOffsetByIdentifier(
          index.value
        );

        if (typeof offsetInModule === "undefined") {
          throw newUnexpectedFunction(index.value);
        }

        // Replace the index Identifier
        // $FlowIgnore: reference?
        node.index = numberLiteralFromRaw(offsetInModule);
      }
    },
  });
}
