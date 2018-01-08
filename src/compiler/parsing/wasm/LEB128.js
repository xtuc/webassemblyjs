/**
 * Initial implementation from https://github.com/brodybits/leb
 *
 * See licence in /docs/thirdparty-licenses.txt
 *
 * Changes made by the xtuc/js-webassembly-interpreter contributors:
 * - refactor: move alls functions into one file and remove the unused functions
 * - feat: added some constants
 */

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-int
 * max = ceil(32/7)
 */
export const MAX_NUMBER_OF_BYTE_U32 = 5;

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-int
 * max = ceil(64/7)
 */
export const MAX_NUMBER_OF_BYTE_U64 = 10;

/** Maximum length of kept temporary buffers. */
const TEMP_BUF_MAXIMUM_LENGTH = 20;

/** Pool of buffers, where `bufPool[x].length === x`. */
const bufPool = [];

function decodeBufferCommon(encodedBuffer, index, signed) {
  index = index === undefined ? 0 : index;

  let length = encodedLength(encodedBuffer, index);
  const bitLength = length * 7;
  let byteLength = Math.ceil(bitLength / 8);
  let result = bufAlloc(byteLength);
  let outIndex = 0;

  while (length > 0) {
    bitsInject(result, outIndex, 7, encodedBuffer[index]);
    outIndex += 7;
    index++;
    length--;
  }

  let signBit;
  let signByte;

  if (signed) {
    // Sign-extend the last byte.
    let lastByte = result[byteLength - 1];
    const endBit = outIndex % 8;
    if (endBit !== 0) {
      const shift = 32 - endBit; // 32 because JS bit ops work on 32-bit ints.
      lastByte = result[byteLength - 1] = ((lastByte << shift) >> shift) & 0xff;
    }
    signBit = lastByte >> 7;
    signByte = signBit * 0xff;
  } else {
    signBit = 0;
    signByte = 0;
  }

  // Slice off any superfluous bytes, that is, ones that add no meaningful
  // bits (because the value would be the same if they were removed).
  while (
    byteLength > 1 &&
    result[byteLength - 1] === signByte &&
    (!signed || result[byteLength - 2] >> 7 === signBit)
  ) {
    byteLength--;
  }
  result = bufResize(result, byteLength);

  return { value: result, nextIndex: index };
}

/**
 * Injects the given bits into the given buffer at the given index. Any
 * bits in the value beyond the length to set are ignored.
 */
function bitsInject(buffer, bitIndex, bitLength, value) {
  if (bitLength < 0 || bitLength > 32) {
    throw new Error("Bad value for bitLength.");
  }

  const lastByte = Math.floor((bitIndex + bitLength - 1) / 8);
  if (bitIndex < 0 || lastByte >= buffer.length) {
    throw new Error("Index out of range.");
  }

  // Just keeping it simple, until / unless profiling shows that this
  // is a problem.

  let atByte = Math.floor(bitIndex / 8);
  let atBit = bitIndex % 8;

  while (bitLength > 0) {
    if (value & 1) {
      buffer[atByte] |= 1 << atBit;
    } else {
      buffer[atByte] &= ~(1 << atBit);
    }

    value >>= 1;
    bitLength--;

    atBit = (atBit + 1) % 8;
    if (atBit === 0) {
      atByte++;
    }
  }
}

/**
 * Resizes a buffer, returning a new buffer. Returns the argument if
 * the length wouldn't actually change. This function is only safe to
 * use if the given buffer was allocated within this module (since
 * otherwise the buffer might possibly be shared externally).
 */
function bufResize(buffer, length) {
  if (length === buffer.length) {
    return buffer;
  }

  const newBuf = bufAlloc(length);

  buffer.copy(newBuf);
  bufFree(buffer);
  return newBuf;
}

/**
 * Allocates a buffer of the given length, which is initialized
 * with all zeroes. This returns a buffer from the pool if it is
 * available, or a freshly-allocated buffer if not.
 */
function bufAlloc(length) {
  let result = bufPool[length];

  if (result) {
    bufPool[length] = undefined;
  } else {
    result = new Buffer(length);
  }

  result.fill(0);
  return result;
}

/**
 * Gets the byte-length of the value encoded in the given buffer at
 * the given index.
 */
function encodedLength(encodedBuffer, index) {
  let result = 0;

  while (encodedBuffer[index + result] >= 0x80) {
    result++;
  }

  result++; // to account for the last byte

  if (index + result > encodedBuffer.length) {
    throw new Error("Bogus encoding");
  }

  return result;
}

/**
 * Releases a buffer back to the pool.
 */
function bufFree(buffer) {
  const length = buffer.length;

  if (length < TEMP_BUF_MAXIMUM_LENGTH) {
    bufPool[length] = buffer;
  }
}

export function decodeUInt64(encodedBuffer, index) {
  const result = decodeBufferCommon(encodedBuffer, index, false);
  const parsed = bufReadUInt(result.value);
  const value = parsed.value;

  bufFree(result.value);

  return { value: value, nextIndex: result.nextIndex, lossy: parsed.lossy };
}

export function decodeUInt32(encodedBuffer, index) {
  const result = decodeBufferCommon(encodedBuffer, index, false);
  const parsed = bufReadUInt(result.value);
  const value = parsed.value;

  bufFree(result.value);

  return { value: value, nextIndex: result.nextIndex };
}

/**
 * Reads an arbitrary unsigned int from a buffer.
 */
function bufReadUInt(buffer) {
  const length = buffer.length;
  let result = 0;
  let lossy = false;

  // Note: See above in re bit manipulation.

  if (length < 7) {
    // Common case which can't possibly be lossy (see above).
    for (let i = length - 1; i >= 0; i--) {
      result = result * 0x100 + buffer[i];
    }
  } else {
    for (let i = length - 1; i >= 0; i--) {
      const one = buffer[i];
      result *= 0x100;
      if (isLossyToAdd(result, one)) {
        lossy = true;
      }
      result += one;
    }
  }

  return { value: result, lossy: lossy };
}

/**
 * Gets whether trying to add the second number to the first is lossy
 * (inexact). The first number is meant to be an accumulated result.
 */
function isLossyToAdd(accum, num) {
  if (num === 0) {
    return false;
  }

  const lowBit = lowestBit(num);
  const added = accum + lowBit;

  if (added === accum) {
    return true;
  }

  if (added - lowBit !== accum) {
    return true;
  }

  return false;
}

/**
 * Masks off all but the lowest bit set of the given number.
 */
function lowestBit(num) {
  return num & -num;
}
