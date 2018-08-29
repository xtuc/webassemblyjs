// @flow
import { RuntimeError } from "../../../errors";

function createInstance(
  atOffset: number,
  n: Func,
  fromModule: ModuleInstance
): FuncInstance {
  //       [param*, result*]
  const type = [[], []];

  if (n.signature.type !== "Signature") {
    throw new RuntimeError(
      "Function signatures must be denormalised before execution"
    );
  }

  const signature = (n.signature: Signature);
  signature.params.forEach(param => {
    type[0].push(param.valtype);
  });

  signature.results.forEach(result => {
    type[1].push(result);
  });

  const code = n.body;

  return {
    atOffset,
    type,
    code,
    module: fromModule,
    isExternal: false
  };
}

module.exports = {
  createInstance
};
