// @flow

function assert(cond: boolean) {
  if (!cond) {
    throw new Error('assertion error');
  }
}

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

export function instruction(id: string, args: Array<Number | string> = []): Instruction {
  assert(typeof args === 'object' && typeof args.length !== 'undefined');

  return {
    type: 'Instr',
    id,
    args,
  };
}

export function loopInstruction(
  label: ?Identifier,
  resulttype: ?Valtype,
  instr: Array<Instruction>,
): LoopInstruction {
  assert(typeof instr === 'object' && typeof instr.length !== 'undefined');

  return {
    type: 'LoopInstruction',
    id: 'loop',
    label,
    resulttype,
    instr,
  };
}

export function blockInstruction(
  label: ?Identifier,
  instr: Array<Instruction>,
): BlockInstruction {
  assert(typeof instr === 'object' && typeof instr.length !== 'undefined');

  return {
    type: 'BlockInstruction',
    id: 'block',
    label,
    instr,
  };
}

export function numberLiteral(
  value: number,
): NumberLiteral {

  return {
    type: 'NumberLiteral',
    value,
  };
}

export function callInstruction(
  index: Index,
): CallInstruction {

  return {
    type: 'CallInstruction',
    id: 'call',
    index,
  };
}

export function ifInstruction(
  test: Instruction,
  result: ?Valtype,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>,
): IfInstruction {

  return {
    type: 'IfInstruction',
    id: 'if',
    test,
    result,
    consequent,
    alternate,
  };
}

export function withLoc(n: Node, end: Position, start: Position): Node {
  const loc = {
    start,
    end,
  };

  n.loc = loc;

  return n;
}
