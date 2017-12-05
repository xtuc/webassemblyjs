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

export function moduleExport(name: string, type: ExportDescr, id: string): ModuleExport {
  return {
    type: 'ModuleExport',
    name,
    descr: {
      type,
      id,
    }
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

export function withLoc(n: Node, end: Position, start: Position): Node {
  const loc = {
    start,
    end,
  };

  n.loc = loc;

  return n;
}
