/**
 * Initial implementation from https://github.com/feross/ieee754
 */

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

export const SINGLE_PRECISION_MANTISSA = 1 + 23;

export const DOUBLE_PRECISION_MANTISSA = 1 + 52;

export function decode(buffer, offset, isLE, mLen, nBytes) {
  let e, m;
  const eLen = nBytes * 8 - mLen - 1;
  const eMax = (1 << eLen) - 1;
  const eBias = eMax >> 1;
  let nBits = -7;
  let i = isLE ? nBytes - 1 : 0;
  const d = isLE ? -1 : 1;
  let s = buffer[offset + i];

  i += d;

  e = s & ((1 << -nBits) - 1);
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << -nBits) - 1);
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
