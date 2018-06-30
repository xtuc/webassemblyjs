// @flow

import { instr } from "./nodes";
import { numberLiteralFromRaw } from "@webassemblyjs/node-helper";

export function instruction(
  id: string,
  args: Array<Expression> = [],
  namedArgs?: Object = {}
): Instr {
  return instr(id, undefined, args, namedArgs);
}

export function objectInstruction(
  id: string,
  object: Valtype,
  args: Array<Expression> = [],
  namedArgs?: Object = {}
): Instr {
  return instr(id, object, args, namedArgs);
}

/**
 * Decorators
 */

export function withLoc(n: Node, end: Position, start: Position): Node {
  const loc = {
    start,
    end
  };

  n.loc = loc;

  return n;
}

export function withRaw(n: NumericLiteral, raw: string): Node {
  n.raw = raw;
  return n;
}

export function funcParam(valtype: Valtype, id: ?string): FuncParam {
  return {
    id,
    valtype
  };
}

export function indexLiteral(value: number | string): Index {
  // $FlowIgnore
  const x: NumberLiteral = numberLiteralFromRaw(value, "u32");

  return x;
}

export function memIndexLiteral(value: number): Memidx {
  // $FlowIgnore
  const x: U32Literal = numberLiteralFromRaw(value, "u32");
  return x;
}
