// @flow

export function identifier(name: string): Identifier {
  return {
    type: 'Identifier',
    name,
  };
}

export function program(body: [ Intruction | Module ]): Program {
  return {
    type: 'Program',
    body,
  };
}

export function module(id: ?string, fields: ?ModuleFields): Module {
  return {
    type: 'Module',
    id,
    fields,
  };
}

export function func(
  id: ?string,
  params: Array<Type>,
  result: ?Type,
  body: Array<Intruction>,
): Func {
  return {
    type: 'Func',
    id,
    params,
    result,
    body,
  };
}
