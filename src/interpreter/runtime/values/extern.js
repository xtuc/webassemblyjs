// @flow

export function createFuncInstance(
  func: Function,
  params: Array<Valtype>,
  results: Array<Valtype>
): FuncInstance {
  const type = [params, results];

  return {
    type,
    code: func,
    module: null,
    isExternal: true
  };
}

export function createGlobalInstance(
  value: NumericOperations<*>,
  type: Valtype,
  mutability: Mutability
): GlobalInstance {
  return {
    type,
    mutability,
    value
  };
}
