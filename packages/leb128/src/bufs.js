// Copyright 2012 The Obvious Corporation.

/*
 * bufs: Buffer utilities.
 */

/*
 * Module variables
 */

/** Pool of buffers, where `bufPool[x].length === x`. */
const bufPool = [];

/** Maximum length of kept temporary buffers. */
const TEMP_BUF_MAXIMUM_LENGTH = 20;

/** Minimum exactly-representable 64-bit int. */
const MIN_EXACT_INT64 = -0x8000000000000000;

/** Maximum exactly-representable 64-bit int. */
const MAX_EXACT_INT64 = 0x7ffffffffffffc00;

/** Maximum exactly-representable 64-bit uint. */
const MAX_EXACT_UINT64 = 0xfffffffffffff800;

/**
 * The int value consisting just of a 1 in bit #32 (that is, one more
 * than the maximum 32-bit unsigned value).
 */
const BIT_32 = 0x100000000;

/**
 * The int value consisting just of a 1 in bit #64 (that is, one more
 * than the maximum 64-bit unsigned value).
 */
const BIT_64 = 0x10000000000000000;

/*
 * Helper functions
 */

/**
 * Masks off all but the lowest bit set of the given number.
 */
function lowestBit(num) {
  return num & -num;
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

/*
 * Exported functions
 */

/**
 * Allocates a buffer of the given length, which is initialized
 * with all zeroes. This returns a buffer from the pool if it is
 * available, or a freshly-allocated buffer if not.
 */
export function alloc(length) {
  let result = bufPool[length];

  if (result) {
    bufPool[length] = undefined;
  } else {
    result = new Uint8Array(length);
  }

  result.fill(0);
  return result;
}

/**
 * Releases a buffer back to the pool.
 */
export function free(buffer) {
  const length = buffer.length;

  if (length < TEMP_BUF_MAXIMUM_LENGTH) {
    bufPool[length] = buffer;
  }
}

/**
 * Resizes a buffer, returning a new buffer. Returns the argument if
 * the length wouldn't actually change. This function is only safe to
 * use if the given buffer was allocated within this module (since
 * otherwise the buffer might possibly be shared externally).
 */
export function resize(buffer, length) {
  if (length === buffer.length) {
    return buffer;
  }

  const newBuf = alloc(length);

  for (let i = 0; i <= buffer.length; i++) {
    newBuf[i] = buffer[i]
  }
  free(buffer);
  return newBuf;
}

/**
 * Reads an arbitrary signed int from a buffer.
 */
export function readInt(buffer) {
  const length = buffer.length;
  const positive = buffer[length - 1] < 0x80;
  let result = positive ? 0 : -1;
  let lossy = false;

  // Note: We can't use bit manipulation here, since that stops
  // working if the result won't fit in a 32-bit int.

  if (length < 7) {
    // Common case which can't possibly be lossy (because the result has
    // no more than 48 bits, and loss only happens with 54 or more).
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
 * Reads an arbitrary unsigned int from a buffer.
 */
export function readUInt(buffer) {
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
 * Writes a little-endian 64-bit signed int into a buffer.
 */
export function writeInt64(value, buffer) {
  if (value < MIN_EXACT_INT64 || value > MAX_EXACT_INT64) {
    throw new Error("Value out of range.");
  }

  if (value < 0) {
    value += BIT_64;
  }

  writeUInt64(value, buffer);
}

/**
 * Writes a little-endian 64-bit unsigned int into a buffer.
 */
export function writeUInt64(value, buffer) {
  if (value < 0 || value > MAX_EXACT_UINT64) {
    throw new Error("Value out of range.");
  }

  const lowWord = value % BIT_32;
  const highWord = Math.floor(value / BIT_32);

  buffer[0] = lowWord & 0xff;
  buffer[1] = (lowWord >> 8) & 0xff;
  buffer[2] = (lowWord >> 16) & 0xff;
  buffer[3] = (lowWord >> 24) & 0xff;
  buffer[4] = highWord & 0xff;
  buffer[5] = (highWord >> 8) & 0xff;
  buffer[6] = (highWord >> 16) & 0xff;
  buffer[7] = (highWord >> 24) & 0xff;
}
