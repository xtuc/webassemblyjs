// @flow

function concatUint8Arrays(...arrays: Array<Uint8Array>) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function overrideBytesInBuffer(
  buffer: Uint8Array,
  startLoc: number,
  endLoc: number,
  newBytes: Array<Byte>
): Uint8Array {
  const beforeBytes = buffer.slice(0, startLoc);
  const afterBytes = buffer.slice(endLoc, buffer.length);

  // Remplacement is empty, we can omit it
  if (newBytes.length === 0) {
    return concatUint8Arrays(beforeBytes, afterBytes);
  }

  const replacement = Uint8Array.from(newBytes);

  return concatUint8Arrays(beforeBytes, replacement, afterBytes);
}
