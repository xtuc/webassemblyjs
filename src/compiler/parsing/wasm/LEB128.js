/**
 * Initial implementation from https://github.com/brodybits/leb
 */

/** Maximum length of kept temporary buffers. */
const TEMP_BUF_MAXIMUM_LENGTH = 20;

/** Pool of buffers, where `bufPool[x].length === x`. */
const bufPool = [];

export function decode(encodedBuffer, index) {
  index = (index === undefined) ? 0 : index;

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

  const signed = false;

  const signBit = 0;
  const signByte = 0;

  // Slice off any superfluous bytes, that is, ones that add no meaningful
  // bits (because the value would be the same if they were removed).
  while ((byteLength > 1) &&
         (result[byteLength - 1] === signByte) &&
         (!signed || ((result[byteLength - 2] >> 7) === signBit))) {
    byteLength--;
  }
  result = bufResize(result, byteLength);

  return {value: result, nextIndex: index};
}

/**
 * Injects the given bits into the given buffer at the given index. Any
 * bits in the value beyond the length to set are ignored.
 */
function bitsInject(buffer, bitIndex, bitLength, value) {
  if ((bitLength < 0) || (bitLength > 32)) {
    throw new Error('Bad value for bitLength.');
  }

  const lastByte = Math.floor((bitIndex + bitLength - 1) / 8);
  if ((bitIndex < 0) || (lastByte >= buffer.length)) {
    throw new Error('Index out of range.');
  }

  // Just keeping it simple, until / unless profiling shows that this
  // is a problem.

  let atByte = Math.floor(bitIndex / 8);
  let atBit = bitIndex % 8;

  while (bitLength > 0) {
    if (value & 1) {
      buffer[atByte] |= (1 << atBit);
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

  if ((index + result) > encodedBuffer.length) {
    throw new Error('Bogus encoding');
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
