// @flow

import { write } from "ieee754";

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-float
 * n = 32/8
 */
export const NUMBER_OF_BYTE_F32 = 4;

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-float
 * n = 64/8
 */
export const NUMBER_OF_BYTE_F64 = 8;

export const SINGLE_PRECISION_MANTISSA = 23;

export const DOUBLE_PRECISION_MANTISSA = 52;

export function encodeF32(v: number): Array<number> {
  const buffer = [];

  write(buffer, v, 0, true, SINGLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F32);

  return buffer;
}

export function encodeF64(v: number): Array<number> {
  const buffer = [];

  write(buffer, v, 0, true, DOUBLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F64);

  return buffer;
}
