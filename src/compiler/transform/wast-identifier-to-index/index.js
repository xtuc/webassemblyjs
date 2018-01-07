// @flow

const {traverse} = require('../../AST/traverse');
const t = require('../../AST');

export function transform(ast: Program) {

  traverse(ast, {

    Func(path: NodePath<Func>) {
      transformFuncPath(path);
    }

  });
}

function transformFuncPath(funcPath: NodePath<Func>) {
  const funcNode = funcPath.node;
  const {params} = funcNode;

  traverse(funcNode, {

    Instr(instrPath: NodePath<Instruction>) {
      const instrNode = instrPath.node;

      if (
        instrNode.id === 'get_local'
        || instrNode.id === 'set_local'
        || instrNode.id === 'tee_local'
      ) {
        const [firstArg] = instrNode.args;

        if (firstArg.type === 'Identifier') {
          const offsetInParams = params.findIndex(({id}) => id === firstArg.name);

          if (offsetInParams === -1) {
            throw new Error(
              `${firstArg.name} not found in ${instrNode.id}: not declared in func params`
            );
          }

          const indexNode = t.numberLiteral(offsetInParams);

          // Replace the Identifer node with our new NumberLiteral node
          instrNode.args[0] = indexNode;
        }

      }
    }

  });
}
