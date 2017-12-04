// @flow

export function identifier(name: string): Identifier {
  return {
    type: 'Identifier',
    name,
  };
}

export function program(body: Array<Instruction | Module>): Program {
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
  body: Array<Instruction>,
): Func {
  return {
    type: 'Func',
    id,
    params,
    result,
    body,
  };
}

export function instruction(id: string, args: ?Array<Number | string>): Instruction {

  if (args && args.length > 0) {

    return {
      type: 'Instr',
      id,
      args,
    };
  } else {

    return {
      type: 'Instr',
      id,
      args: undefined,
    };
  }
}
