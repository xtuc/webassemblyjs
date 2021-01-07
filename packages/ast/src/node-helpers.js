// @flow

import {
  parse32F,
  parse64F,
  parse32I,
  parse64I,
  parseU32,
  isNanLiteral,
  isInfLiteral
} from "@webassemblyjs/helper-numbers";

import { longNumberLiteral, floatLiteral, numberLiteral, instr } from "./nodes";

export function numberLiteralFromRaw(
  rawValue: number | string,
  instructionType: Valtype = "i32"
): NumericLiteral {
  const original = rawValue;

  // Remove numeric separators _
  if (typeof rawValue === "string") {
    rawValue = rawValue.replace(/_/g, "");
  }

  if (typeof rawValue === "number") {
    return numberLiteral(rawValue, String(original));
  } else {
    switch (instructionType) {
      case "i32": {
        return numberLiteral(parse32I(rawValue), String(original));
      }
      case "u32": {
        return numberLiteral(parseU32(rawValue), String(original));
      }
      case "i64": {
        return longNumberLiteral(parse64I(rawValue), String(original));
      }
      case "f32": {
        return floatLiteral(
          parse32F(rawValue),
          isNanLiteral(rawValue),
          isInfLiteral(rawValue),
          String(original)
        );
      }
      // f64
      default: {
        return floatLiteral(
          parse64F(rawValue),
          isNanLiteral(rawValue),
          isInfLiteral(rawValue),
          String(original)
        );
      }
    }
  }
}

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
