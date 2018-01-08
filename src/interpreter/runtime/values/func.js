// @flow

function createInstance(n: Func, fromModule: ModuleInstance): FuncInstance {
  //       [param*, result*]
  const type = [[], []];

  n.params.forEach(param => {
    type[0].push(param.valtype);
  });

  if (n.result) {
    type[1].push(n.result);
  }

  const code = n.body;

  return {
    type,
    code,
    module: fromModule,
    isExternal: false
  };
}

function createExternalInstance(func: Function): FuncInstance {
  const type = [[], []];

  return {
    type,
    code: func,
    module: null,
    isExternal: true
  };
}

module.exports = {
  createInstance,
  createExternalInstance
};
