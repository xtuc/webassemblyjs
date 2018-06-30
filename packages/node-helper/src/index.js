// @flow

const {
  parse32F,
  parse64F,
  parse32I,
  parse64I,
  parseU32,
  isNanLiteral,
  isInfLiteral
} = require("./number-literals");

import { longNumberLiteral, floatLiteral, numberLiteral } from "./nodes";

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
